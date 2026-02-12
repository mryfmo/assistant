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

function createServerWithConfig(config: {
  maxActiveWorkflowsPerTenant: number;
  maxTaskPayloadBytes: number;
}): { server: RuntimeGrpcServiceServer; orchestrator: RuntimeOrchestrator } {
  const db = new RuntimePersistenceDb();
  const orchestrator: RuntimeOrchestrator = {
    db,
    workflowRepository: new WorkflowRepository(db),
    taskRepository: new TaskRepository(db),
    leaseRepository: new LeaseRepository(db),
    artifactRepository: new ArtifactRepository(db),
  };

  return {
    orchestrator,
    server: new RuntimeGrpcServiceServer({
      handlers: createOrchestratorServiceHandlers(orchestrator, {
        env: "sandbox",
        dbDsn: undefined,
        leaseTtlSeconds: 30,
        maxRetry: 3,
        requireMtls: false,
        artifactBackend: "local",
        maxActiveWorkflowsPerTenant: config.maxActiveWorkflowsPerTenant,
        maxTaskPayloadBytes: config.maxTaskPayloadBytes,
        planStageTimeoutSeconds: 60,
        taskExecutionTimeoutSeconds: 300,
      }),
    }),
  };
}

test("runtime limits enforce payload size and tenant concurrency", async () => {
  const { server } = createServerWithConfig({
    maxActiveWorkflowsPerTenant: 1,
    maxTaskPayloadBytes: 8,
  });
  await server.start();
  const client = new RuntimeGrpcServiceClient(server);

  const tooLarge = await client.submitPlan({
    request_id: "req-limits-1",
    workflow_id: "wf-limits-1",
    tenant_id: "tenant-a",
    intent: "payload-too-large",
  });
  assert.equal(tooLarge.ok, false);
  assert.equal(tooLarge.error?.code, "POLICY_DENIED");

  const first = await client.submitPlan({
    request_id: "req-limits-2",
    workflow_id: "wf-limits-2",
    tenant_id: "tenant-a",
    intent: "ok",
  });
  assert.equal(first.ok, true);

  const second = await client.submitPlan({
    request_id: "req-limits-3",
    workflow_id: "wf-limits-3",
    tenant_id: "tenant-a",
    intent: "ok",
  });
  assert.equal(second.ok, false);
  assert.equal(second.error?.code, "POLICY_DENIED");

  await server.stop();
});

test("runtime limits trigger load shedding under queue pressure", async () => {
  const { server } = createServerWithConfig({
    maxActiveWorkflowsPerTenant: 1,
    maxTaskPayloadBytes: 512 * 1024,
  });
  await server.start();
  const client = new RuntimeGrpcServiceClient(server);

  for (const suffix of ["a", "b", "c", "d"]) {
    const result = await client.submitPlan({
      request_id: `req-shed-${suffix}`,
      workflow_id: `wf-shed-${suffix}`,
      tenant_id: `tenant-${suffix}`,
      intent: "ok",
    });
    assert.equal(result.ok, true);
  }

  const shed = await client.submitPlan({
    request_id: "req-shed-e",
    workflow_id: "wf-shed-e",
    tenant_id: "tenant-e",
    intent: "ok",
  });
  assert.equal(shed.ok, false);
  assert.equal(shed.error?.code, "POLICY_DENIED");

  await server.stop();
});
