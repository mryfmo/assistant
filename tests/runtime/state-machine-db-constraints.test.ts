import assert from "node:assert/strict";
import test from "node:test";

import { RuntimePersistenceDb } from "../../src/core/persistence/db";
import { TaskRepository } from "../../src/core/persistence/task-repository";
import { PersistenceError } from "../../src/core/persistence/types";
import { WorkflowRepository } from "../../src/core/persistence/workflow-repository";

test("DB-level transition guard rejects illegal transitions even when app checks are bypassed", async () => {
  const db = new RuntimePersistenceDb();
  const workflowRepository = new WorkflowRepository(db);
  const taskRepository = new TaskRepository(db);

  await workflowRepository.createWorkflow({ workflow_id: "wf-db-sm-1", tenant_id: "tenant-a" });
  await taskRepository.createTask({
    task_id: "task-db-sm-1",
    workflow_id: "wf-db-sm-1",
    task_type: "execute",
    spec_json: new Uint8Array(),
    idempotency_key: "idem-db-sm-1",
  });

  await assert.rejects(
    db.transaction((tx) => {
      const task = tx.store.tasks.get("task-db-sm-1");
      if (task === undefined) {
        throw new Error("task missing");
      }
      task.state = "succeeded";
    }),
    (error: unknown) =>
      error instanceof PersistenceError && error.code === "ILLEGAL_TASK_TRANSITION",
  );

  const taskAfter = await taskRepository.getTask("task-db-sm-1");
  assert.equal(taskAfter?.state, "queued");
});
