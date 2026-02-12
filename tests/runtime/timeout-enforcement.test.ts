import assert from "node:assert/strict";
import test from "node:test";

import {
  type RuntimeOrchestrator,
  createOrchestratorServiceHandlers,
} from "../../src/core/orchestrator";
import { isTimeoutExceeded } from "../../src/core/orchestrator/timeout-enforcer";
import { ArtifactRepository } from "../../src/core/persistence/artifact-repository";
import { RuntimePersistenceDb } from "../../src/core/persistence/db";
import { LeaseRepository } from "../../src/core/persistence/lease-repository";
import { TaskRepository } from "../../src/core/persistence/task-repository";
import { WorkflowRepository } from "../../src/core/persistence/workflow-repository";
import { RuntimeGrpcServiceClient } from "../../src/core/runtime/grpc/client";
import { RuntimeGrpcServiceServer } from "../../src/core/runtime/grpc/server";

test("timeout helper enforces configured timeout units", () => {
  assert.equal(
    isTimeoutExceeded({ startedUnixMs: 0, nowUnixMs: 60_001, timeoutSeconds: 60 }),
    true,
  );
  assert.equal(
    isTimeoutExceeded({ startedUnixMs: 0, nowUnixMs: 300_000, timeoutSeconds: 300 }),
    false,
  );
});

test("LeaseNextTask rejects timed-out plan/task using runtime config", async () => {
  let currentNow = 0;
  const db = new RuntimePersistenceDb({
    clock: {
      now: () => currentNow,
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
    workflow_id: "wf-timeout-1",
    tenant_id: "tenant-a",
  });
  await orchestrator.taskRepository.createTask({
    task_id: "task-timeout-1",
    workflow_id: "wf-timeout-1",
    task_type: "execute",
    spec_json: new Uint8Array(),
    idempotency_key: "idem-timeout-1",
  });

  const server = new RuntimeGrpcServiceServer({
    handlers: createOrchestratorServiceHandlers(orchestrator, {
      env: "sandbox",
      dbDsn: undefined,
      leaseTtlSeconds: 30,
      maxRetry: 3,
      requireMtls: false,
      artifactBackend: "local",
      maxActiveWorkflowsPerTenant: 200,
      maxTaskPayloadBytes: 512 * 1024,
      planStageTimeoutSeconds: 1,
      taskExecutionTimeoutSeconds: 300,
    }),
  });
  await server.start();

  const client = new RuntimeGrpcServiceClient(server);
  currentNow = 2_000;
  const timedOut = await client.leaseNextTask({
    request_id: "req-timeout-1",
    worker_id: "worker-a",
    worker_capabilities_json: "{}",
  });

  assert.equal(timedOut.error?.code, "TASK_TIMEOUT");
  const taskAfter = await orchestrator.taskRepository.getTask("task-timeout-1");
  assert.equal(taskAfter?.state, "failed");

  await server.stop();
});
