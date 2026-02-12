import { canTransitionTaskState } from "../domain/state-machine";
import {
  type ArtifactRecord,
  type LeaseRecord,
  PersistenceError,
  type RuntimeClock,
  type RuntimeDbStore,
  type TaskRecord,
  type WorkflowRecord,
} from "./types";

const systemClock: RuntimeClock = {
  now: () => Date.now(),
};

function cloneWorkflowRecord(record: WorkflowRecord): WorkflowRecord {
  return { ...record };
}

function cloneTaskRecord(record: TaskRecord): TaskRecord {
  return {
    ...record,
    spec_json: new Uint8Array(record.spec_json),
  };
}

function cloneLeaseRecord(record: LeaseRecord): LeaseRecord {
  return { ...record };
}

function cloneArtifactRecord(record: ArtifactRecord): ArtifactRecord {
  return { ...record };
}

function cloneStore(store: RuntimeDbStore): RuntimeDbStore {
  return {
    workflows: new Map(
      [...store.workflows.entries()].map(([id, record]) => [id, cloneWorkflowRecord(record)]),
    ),
    tasks: new Map([...store.tasks.entries()].map(([id, record]) => [id, cloneTaskRecord(record)])),
    leases: new Map(
      [...store.leases.entries()].map(([taskId, record]) => [taskId, cloneLeaseRecord(record)]),
    ),
    artifacts: new Map(
      [...store.artifacts.entries()].map(([id, record]) => [id, cloneArtifactRecord(record)]),
    ),
  };
}

export type RuntimeDbTransaction = {
  readonly clock: RuntimeClock;
  readonly store: RuntimeDbStore;
};

export class RuntimePersistenceDb {
  private store: RuntimeDbStore;
  private transactionQueue: Promise<void> = Promise.resolve();
  readonly clock: RuntimeClock;

  constructor(options: { clock?: RuntimeClock } = {}) {
    this.clock = options.clock ?? systemClock;
    this.store = {
      workflows: new Map(),
      tasks: new Map(),
      leases: new Map(),
      artifacts: new Map(),
    };
  }

  snapshot(): RuntimeDbStore {
    return cloneStore(this.store);
  }

  readStore(): Readonly<RuntimeDbStore> {
    return this.store;
  }

  async transaction<T>(callback: (tx: RuntimeDbTransaction) => Promise<T> | T): Promise<T> {
    const runTransaction = async (): Promise<T> => {
      const workingStore = cloneStore(this.store);
      const tx: RuntimeDbTransaction = {
        clock: this.clock,
        store: workingStore,
      };

      const result = await callback(tx);
      this.validateInvariantConstraints(workingStore);
      this.store = workingStore;
      return result;
    };

    const transaction = this.transactionQueue.then(runTransaction, runTransaction);
    this.transactionQueue = transaction.then(
      () => undefined,
      () => undefined,
    );

    return transaction;
  }

  private validateInvariantConstraints(store: RuntimeDbStore): void {
    for (const task of store.tasks.values()) {
      if (!store.workflows.has(task.workflow_id)) {
        throw new PersistenceError(
          "INVARIANT_VIOLATION",
          `Task ${task.task_id} references unknown workflow_id ${task.workflow_id}.`,
        );
      }
    }

    for (const lease of store.leases.values()) {
      const task = store.tasks.get(lease.task_id);
      if (task === undefined) {
        throw new PersistenceError(
          "INVARIANT_VIOLATION",
          `Lease for task ${lease.task_id} references a missing task.`,
        );
      }
      if (task.workflow_id !== lease.workflow_id) {
        throw new PersistenceError(
          "INVARIANT_VIOLATION",
          `Lease for task ${lease.task_id} has mismatched workflow_id ${lease.workflow_id}.`,
        );
      }
      if (task.state !== "leased" && task.state !== "running") {
        throw new PersistenceError(
          "INVARIANT_VIOLATION",
          `Lease for task ${lease.task_id} exists while task is in ${task.state}.`,
        );
      }
    }

    for (const artifact of store.artifacts.values()) {
      const task = store.tasks.get(artifact.task_id);
      if (task !== undefined && task.workflow_id !== artifact.workflow_id) {
        throw new PersistenceError(
          "INVARIANT_VIOLATION",
          `Artifact ${artifact.artifact_id} workflow_id mismatch for task ${artifact.task_id}.`,
        );
      }
    }

    const seenIdempotency = new Set<string>();
    for (const task of store.tasks.values()) {
      const key = `${task.workflow_id}::${task.idempotency_key}`;
      if (seenIdempotency.has(key)) {
        throw new PersistenceError(
          "TASK_IDEMPOTENCY_CONFLICT",
          `Duplicate idempotency key ${task.idempotency_key} in workflow ${task.workflow_id}.`,
        );
      }
      seenIdempotency.add(key);
    }

    for (const task of store.tasks.values()) {
      const previous = this.store.tasks.get(task.task_id);
      if (previous === undefined) {
        continue;
      }

      if (previous.workflow_id !== task.workflow_id) {
        throw new PersistenceError(
          "WORKFLOW_ID_IMMUTABLE",
          `workflow_id is immutable for task ${task.task_id}.`,
        );
      }

      if (previous.state !== task.state) {
        const transition = canTransitionTaskState(previous.state, task.state);
        if (!transition.ok) {
          throw new PersistenceError(transition.code, transition.message);
        }
      }
    }
  }
}
