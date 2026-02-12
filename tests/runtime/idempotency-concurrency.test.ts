import assert from "node:assert/strict";
import test from "node:test";

import { RuntimePersistenceDb } from "../../src/core/persistence/db";
import { TaskRepository } from "../../src/core/persistence/task-repository";
import { PersistenceError } from "../../src/core/persistence/types";
import { WorkflowRepository } from "../../src/core/persistence/workflow-repository";

test("duplicate (workflow_id, idempotency_key) is rejected under concurrent inserts", async () => {
  const db = new RuntimePersistenceDb();
  const workflowRepository = new WorkflowRepository(db);
  const taskRepository = new TaskRepository(db);

  await workflowRepository.createWorkflow({ workflow_id: "wf-idem-1", tenant_id: "tenant-a" });

  const createOne = taskRepository.createTask({
    task_id: "task-idem-1",
    workflow_id: "wf-idem-1",
    task_type: "execute",
    spec_json: new Uint8Array(),
    idempotency_key: "idem-key-1",
  });

  const createTwo = taskRepository.createTask({
    task_id: "task-idem-2",
    workflow_id: "wf-idem-1",
    task_type: "execute",
    spec_json: new Uint8Array(),
    idempotency_key: "idem-key-1",
  });

  const results = await Promise.allSettled([createOne, createTwo]);
  const fulfilled = results.filter((result) => result.status === "fulfilled");
  const rejected = results.filter((result) => result.status === "rejected");

  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);

  const reason = rejected[0].reason;
  assert.equal(reason instanceof PersistenceError, true);
  if (reason instanceof PersistenceError) {
    assert.equal(reason.code, "TASK_IDEMPOTENCY_CONFLICT");
  }
});
