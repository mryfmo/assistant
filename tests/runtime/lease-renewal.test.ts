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

test("RenewLease extends TTL and rejects invalid renewals deterministically", async () => {
  let currentNow = 1_000;
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
    workflow_id: "wf-renew-1",
    tenant_id: "tenant-a",
  });
  await orchestrator.taskRepository.createTask({
    task_id: "task-renew-1",
    workflow_id: "wf-renew-1",
    task_type: "execute",
    spec_json: new Uint8Array(),
    idempotency_key: "idem-renew-1",
  });

  const server = new RuntimeGrpcServiceServer({
    handlers: createOrchestratorServiceHandlers(orchestrator, {
      env: "sandbox",
      dbDsn: undefined,
      leaseTtlSeconds: 30,
      maxRetry: 3,
      requireMtls: false,
      allowMtlsMetadataFallback: true,
      artifactBackend: "local",
      maxActiveWorkflowsPerTenant: 200,
      maxTaskPayloadBytes: 512 * 1024,
      planStageTimeoutSeconds: 60,
      taskExecutionTimeoutSeconds: 300,
    }),
  });
  await server.start();
  const client = new RuntimeGrpcServiceClient(server);

  await client.leaseNextTask({
    request_id: "req-renew-1",
    worker_id: "worker-a",
    worker_capabilities_json: "{}",
  });

  currentNow = 5_000;
  const renewed = await client.renewLease({
    request_id: "req-renew-2",
    task_id: "task-renew-1",
    worker_id: "worker-a",
    expires_unix_ms: currentNow,
  });
  assert.equal(renewed.ok, true);

  const lease = await orchestrator.leaseRepository.getLease("task-renew-1");
  assert.equal(lease?.expires_unix_ms, currentNow + 30_000);

  const wrongWorker = await client.renewLease({
    request_id: "req-renew-3",
    task_id: "task-renew-1",
    worker_id: "worker-b",
    expires_unix_ms: currentNow,
  });
  assert.equal(wrongWorker.ok, false);
  assert.equal(wrongWorker.error?.code, "LEASE_CONFLICT");

  currentNow = 40_001;
  const expired = await client.renewLease({
    request_id: "req-renew-4",
    task_id: "task-renew-1",
    worker_id: "worker-a",
    expires_unix_ms: currentNow,
  });
  assert.equal(expired.ok, false);
  assert.equal(expired.error?.code, "TASK_TIMEOUT");

  await server.stop();
});
