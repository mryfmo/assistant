import { type TaskLifecycleState, canTransitionTaskState } from "../domain/state-machine";
import type { RuntimeDbTransaction, RuntimePersistenceDb } from "./db";
import { type LeaseRecord, PersistenceError, type TaskRecord } from "./types";

function cloneTask(task: TaskRecord): TaskRecord {
  return {
    ...task,
    spec_json: new Uint8Array(task.spec_json),
  };
}

function cloneLease(lease: LeaseRecord): LeaseRecord {
  return { ...lease };
}

function now(tx: RuntimeDbTransaction): number {
  return tx.clock.now();
}

function deterministicTaskOrder(left: TaskRecord, right: TaskRecord): number {
  if (left.priority !== right.priority) {
    return left.priority - right.priority;
  }

  if (left.created_at !== right.created_at) {
    return left.created_at - right.created_at;
  }

  return left.task_id.localeCompare(right.task_id);
}

export class TaskRepository {
  constructor(private readonly db: RuntimePersistenceDb) {}

  async createTask(input: {
    task_id: string;
    workflow_id: string;
    task_type: string;
    spec_json: Uint8Array;
    priority?: number;
    idempotency_key: string;
  }): Promise<TaskRecord> {
    return this.db.transaction((tx) => {
      if (!tx.store.workflows.has(input.workflow_id)) {
        throw new PersistenceError(
          "WORKFLOW_NOT_FOUND",
          `Cannot create task ${input.task_id}; workflow ${input.workflow_id} does not exist.`,
        );
      }
      if (tx.store.tasks.has(input.task_id)) {
        throw new PersistenceError("TASK_ALREADY_EXISTS", `Task ${input.task_id} already exists.`);
      }

      for (const task of tx.store.tasks.values()) {
        if (
          task.workflow_id === input.workflow_id &&
          task.idempotency_key === input.idempotency_key
        ) {
          throw new PersistenceError(
            "TASK_IDEMPOTENCY_CONFLICT",
            `Duplicate idempotency key ${input.idempotency_key} in workflow ${input.workflow_id}.`,
          );
        }
      }

      const timestamp = now(tx);
      const task: TaskRecord = {
        task_id: input.task_id,
        workflow_id: input.workflow_id,
        task_type: input.task_type,
        state: "queued",
        spec_json: new Uint8Array(input.spec_json),
        priority: input.priority ?? 100,
        retry_count: 0,
        idempotency_key: input.idempotency_key,
        created_at: timestamp,
        updated_at: timestamp,
      };

      tx.store.tasks.set(task.task_id, task);
      return cloneTask(task);
    });
  }

  async getTask(taskId: string): Promise<TaskRecord | undefined> {
    const task = this.db.readStore().tasks.get(taskId);
    return task === undefined ? undefined : cloneTask(task);
  }

  async listTasksByWorkflow(workflowId: string): Promise<TaskRecord[]> {
    const tasks = [...this.db.readStore().tasks.values()]
      .filter((task) => task.workflow_id === workflowId)
      .sort(deterministicTaskOrder)
      .map((task) => cloneTask(task));
    return tasks;
  }

  async claimNextQueuedTask(input: {
    worker_id: string;
    lease_ttl_ms: number;
  }): Promise<{ task: TaskRecord; lease: LeaseRecord } | undefined> {
    return this.db.transaction((tx) => {
      const candidate = [...tx.store.tasks.values()]
        .filter((task) => task.state === "queued")
        .sort(deterministicTaskOrder)[0];

      if (candidate === undefined) {
        return undefined;
      }

      const transitionCheck = canTransitionTaskState(candidate.state, "leased");
      if (!transitionCheck.ok) {
        throw new PersistenceError(transitionCheck.code, transitionCheck.message);
      }

      candidate.state = "leased";
      candidate.updated_at = now(tx);

      const lease: LeaseRecord = {
        task_id: candidate.task_id,
        workflow_id: candidate.workflow_id,
        worker_id: input.worker_id,
        issued_unix_ms: candidate.updated_at,
        expires_unix_ms: candidate.updated_at + input.lease_ttl_ms,
      };
      tx.store.leases.set(candidate.task_id, lease);

      return {
        task: cloneTask(candidate),
        lease: cloneLease(lease),
      };
    });
  }

  async transitionTaskState(input: {
    task_id: string;
    to_state: TaskLifecycleState;
    expected_from_state?: TaskLifecycleState;
    expected_workflow_id?: string;
    on_after_state_write?: () => void;
  }): Promise<TaskRecord> {
    return this.db.transaction((tx) => {
      const task = tx.store.tasks.get(input.task_id);
      if (task === undefined) {
        throw new PersistenceError("TASK_NOT_FOUND", `Task ${input.task_id} does not exist.`);
      }

      if (
        input.expected_workflow_id !== undefined &&
        input.expected_workflow_id !== task.workflow_id
      ) {
        throw new PersistenceError(
          "WORKFLOW_ID_IMMUTABLE",
          `workflow_id mismatch for task ${task.task_id}: expected ${input.expected_workflow_id} but found ${task.workflow_id}.`,
        );
      }

      if (input.expected_from_state !== undefined && task.state !== input.expected_from_state) {
        throw new PersistenceError(
          "ILLEGAL_TASK_TRANSITION",
          `Task ${task.task_id} is ${task.state}; expected ${input.expected_from_state}.`,
        );
      }

      const transition = canTransitionTaskState(task.state, input.to_state);
      if (!transition.ok) {
        throw new PersistenceError(transition.code, transition.message);
      }

      task.state = input.to_state;
      task.updated_at = now(tx);

      if (input.to_state !== "leased" && input.to_state !== "running") {
        tx.store.leases.delete(task.task_id);
      }

      input.on_after_state_write?.();
      return cloneTask(task);
    });
  }

  async markTaskRunning(taskId: string): Promise<TaskRecord> {
    return this.transitionTaskState({
      task_id: taskId,
      expected_from_state: "leased",
      to_state: "running",
    });
  }

  async completeTaskFromResult(input: {
    task_id: string;
    workflow_id: string;
    success: boolean;
    retryable: boolean;
  }): Promise<TaskRecord> {
    return this.db.transaction((tx) => {
      const task = tx.store.tasks.get(input.task_id);
      if (task === undefined) {
        throw new PersistenceError("TASK_NOT_FOUND", `Task ${input.task_id} does not exist.`);
      }

      if (task.workflow_id !== input.workflow_id) {
        throw new PersistenceError(
          "WORKFLOW_ID_IMMUTABLE",
          `Task ${input.task_id} belongs to workflow ${task.workflow_id}, not ${input.workflow_id}.`,
        );
      }

      const nextState: TaskLifecycleState = input.success
        ? "succeeded"
        : input.retryable
          ? "retry_wait"
          : "failed";
      const transition = canTransitionTaskState(task.state, nextState);
      if (!transition.ok) {
        throw new PersistenceError(transition.code, transition.message);
      }

      if (!input.success) {
        task.retry_count += 1;
      }

      task.state = nextState;
      task.updated_at = now(tx);

      tx.store.leases.delete(task.task_id);

      return cloneTask(task);
    });
  }

  async enqueueRetry(taskId: string): Promise<TaskRecord> {
    return this.transitionTaskState({
      task_id: taskId,
      expected_from_state: "retry_wait",
      to_state: "queued",
    });
  }

  async countNonTerminalTasks(workflowId: string): Promise<number> {
    return [...this.db.readStore().tasks.values()].filter(
      (task) =>
        task.workflow_id === workflowId &&
        task.state !== "succeeded" &&
        task.state !== "failed" &&
        task.state !== "cancelled",
    ).length;
  }
}
