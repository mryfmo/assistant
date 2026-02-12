import assert from "node:assert/strict";
import test from "node:test";

import {
  type RuntimeOrchestrator,
  createOrchestratorServiceHandlers,
} from "../../src/core/orchestrator";
import { ArtifactRepository } from "../../src/core/persistence/artifact-repository";
import { RuntimePersistenceDb } from "../../src/core/persistence/db";
import { LeaseRepository } from "../../src/core/persistence/lease-repository";
import { TaskRepository } from "../../src/core/persistence/task-repository";
import { WorkflowRepository } from "../../src/core/persistence/workflow-repository";
import { RuntimeGrpcServiceClient } from "../../src/core/runtime/grpc/client";
import { RuntimeGrpcServiceServer } from "../../src/core/runtime/grpc/server";

test("LeaseNextTask follows priority -> created_at -> id ordering", async () => {
  let tick = 1_000;
  const db = new RuntimePersistenceDb({
    clock: {
      now: () => {
        tick += 1;
        return tick;
      },
    },
  });
  const orchestrator: RuntimeOrchestrator = {
    db,
    workflowRepository: new WorkflowRepository(db),
    taskRepository: new TaskRepository(db),
    leaseRepository: new LeaseRepository(db),
    artifactRepository: new ArtifactRepository(db),
  };

  await orchestrator.workflowRepository.createWorkflow({
    workflow_id: "wf-lease-1",
    tenant_id: "tenant-a",
  });

  await orchestrator.taskRepository.createTask({
    task_id: "task-c",
    workflow_id: "wf-lease-1",
    task_type: "execute",
    spec_json: new Uint8Array(),
    priority: 200,
    idempotency_key: "idem-c",
  });
  await orchestrator.taskRepository.createTask({
    task_id: "task-a",
    workflow_id: "wf-lease-1",
    task_type: "execute",
    spec_json: new Uint8Array(),
    priority: 100,
    idempotency_key: "idem-a",
  });
  await orchestrator.taskRepository.createTask({
    task_id: "task-b",
    workflow_id: "wf-lease-1",
    task_type: "execute",
    spec_json: new Uint8Array(),
    priority: 100,
    idempotency_key: "idem-b",
  });

  const server = new RuntimeGrpcServiceServer({
    handlers: createOrchestratorServiceHandlers(orchestrator, {
      env: "sandbox",
      leaseTtlSeconds: 30,
      maxRetry: 3,
      requireMtls: false,
      artifactBackend: "local",
      maxActiveWorkflowsPerTenant: 200,
      maxTaskPayloadBytes: 512 * 1024,
      planStageTimeoutSeconds: 60,
      taskExecutionTimeoutSeconds: 300,
    }),
  });
  await server.start();
  const client = new RuntimeGrpcServiceClient(server);

  const first = await client.leaseNextTask({
    request_id: "req-lease-1",
    worker_id: "worker-a",
    worker_capabilities_json: "{}",
  });
  const second = await client.leaseNextTask({
    request_id: "req-lease-2",
    worker_id: "worker-a",
    worker_capabilities_json: "{}",
  });
  const third = await client.leaseNextTask({
    request_id: "req-lease-3",
    worker_id: "worker-a",
    worker_capabilities_json: "{}",
  });

  assert.equal(first.task?.task_id, "task-a");
  assert.equal(second.task?.task_id, "task-b");
  assert.equal(third.task?.task_id, "task-c");

  await server.stop();
});
