import assert from "node:assert/strict";
import test from "node:test";

import { RuntimePersistenceDb } from "../../src/core/persistence/db";
import { TaskRepository } from "../../src/core/persistence/task-repository";
import { WorkflowRepository } from "../../src/core/persistence/workflow-repository";

test("state transition writes are atomic when failures are injected", async () => {
  const db = new RuntimePersistenceDb();
  const workflowRepository = new WorkflowRepository(db);
  const taskRepository = new TaskRepository(db);

  await workflowRepository.createWorkflow({ workflow_id: "wf-atomic-1", tenant_id: "tenant-a" });
  await taskRepository.createTask({
    task_id: "task-atomic-1",
    workflow_id: "wf-atomic-1",
    task_type: "execute",
    spec_json: new Uint8Array(),
    idempotency_key: "idem-atomic-1",
  });

  await assert.rejects(
    taskRepository.transitionTaskState({
      task_id: "task-atomic-1",
      expected_from_state: "queued",
      to_state: "leased",
      on_after_state_write: () => {
        throw new Error("injected-failure");
      },
    }),
    new Error("injected-failure"),
  );

  const taskAfter = await taskRepository.getTask("task-atomic-1");
  assert.equal(taskAfter?.state, "queued");
  assert.equal(db.readStore().leases.has("task-atomic-1"), false);
});
