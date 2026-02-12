import assert from "node:assert/strict";
import test from "node:test";

import { ArtifactRepository } from "../../src/core/persistence/artifact-repository";
import { RuntimePersistenceDb } from "../../src/core/persistence/db";
import { TaskRepository } from "../../src/core/persistence/task-repository";
import { PersistenceError } from "../../src/core/persistence/types";
import { WorkflowRepository } from "../../src/core/persistence/workflow-repository";

test("workflow_id immutability rejects mismatched workflow references deterministically", async () => {
  const db = new RuntimePersistenceDb();
  const workflowRepository = new WorkflowRepository(db);
  const taskRepository = new TaskRepository(db);
  const artifactRepository = new ArtifactRepository(db);

  await workflowRepository.createWorkflow({ workflow_id: "wf-imm-1", tenant_id: "tenant-a" });
  await workflowRepository.createWorkflow({ workflow_id: "wf-imm-2", tenant_id: "tenant-a" });
  await taskRepository.createTask({
    task_id: "task-imm-1",
    workflow_id: "wf-imm-1",
    task_type: "execute",
    spec_json: new Uint8Array(),
    idempotency_key: "idem-imm-1",
  });

  await assert.rejects(
    taskRepository.transitionTaskState({
      task_id: "task-imm-1",
      expected_workflow_id: "wf-imm-2",
      to_state: "leased",
    }),
    (error: unknown) => error instanceof PersistenceError && error.code === "WORKFLOW_ID_IMMUTABLE",
  );

  await assert.rejects(
    artifactRepository.registerArtifact({
      artifact_id: "artifact-imm-1",
      workflow_id: "wf-imm-2",
      task_id: "task-imm-1",
      uri: "file:///tmp/a.json",
      digest: "digest-1",
    }),
    (error: unknown) => error instanceof PersistenceError && error.code === "WORKFLOW_ID_IMMUTABLE",
  );
});
