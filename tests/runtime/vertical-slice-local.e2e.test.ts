import assert from "node:assert/strict";
import test from "node:test";

import { RuntimeGrpcServiceClient } from "../../src/core/runtime/grpc/client";
import { createRuntimeGrpcServerWithLocalOrchestrator } from "../../src/core/runtime/grpc/server";

test("local vertical slice submit -> lease -> report -> workflow terminal", async () => {
  const { server, orchestrator } = createRuntimeGrpcServerWithLocalOrchestrator();
  await server.start();

  const client = new RuntimeGrpcServiceClient(server);

  const submit = await client.submitPlan({
    request_id: "req-e2e-1",
    workflow_id: "wf-e2e-1",
    tenant_id: "tenant-a",
    intent: "run end-to-end local",
  });
  assert.equal(submit.ok, true);

  const lease = await client.leaseNextTask({
    request_id: "req-e2e-2",
    worker_id: "worker-a",
    worker_capabilities_json: "{}",
  });
  assert.equal(lease.task?.task_id, "wf-e2e-1:task:0001");

  const report = await client.reportResult({
    request_id: "req-e2e-3",
    workflow_id: "wf-e2e-1",
    task_id: "wf-e2e-1:task:0001",
    success: true,
    result_json: new Uint8Array(),
  });
  assert.equal(report.ok, true);

  const workflow = await orchestrator.workflowRepository.getWorkflow("wf-e2e-1");
  assert.equal(workflow?.state, "succeeded");

  await server.stop();
});
