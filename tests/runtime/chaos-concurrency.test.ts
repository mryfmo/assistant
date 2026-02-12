import assert from "node:assert/strict";
import test from "node:test";

import { RuntimeGrpcServiceClient } from "../../src/core/runtime/grpc/client";
import { createRuntimeGrpcServerWithLocalOrchestrator } from "../../src/core/runtime/grpc/server";

test("multi-worker contention does not cause double execution or state corruption", async () => {
  const { server, orchestrator } = createRuntimeGrpcServerWithLocalOrchestrator();
  await server.start();
  const client = new RuntimeGrpcServiceClient(server);

  const workflowIds = Array.from({ length: 20 }, (_, index) => `wf-chaos-${index}`);
  for (const workflowId of workflowIds) {
    const submit = await client.submitPlan({
      request_id: `req-chaos-submit-${workflowId}`,
      workflow_id: workflowId,
      tenant_id: `tenant-${workflowId}`,
      intent: "run chaos",
    });
    assert.equal(submit.ok, true);
  }

  const leaseAttempts = await Promise.all(
    Array.from({ length: 30 }, (_, index) =>
      client.leaseNextTask({
        request_id: `req-chaos-lease-${index}`,
        worker_id: `worker-${index % 8}`,
        worker_capabilities_json: "{}",
      }),
    ),
  );

  const leasedTaskIds = leaseAttempts
    .map((lease) => lease.task?.task_id)
    .filter((taskId): taskId is string => taskId !== undefined);
  const uniqueTaskIds = new Set(leasedTaskIds);
  assert.equal(leasedTaskIds.length, uniqueTaskIds.size);
  assert.equal(uniqueTaskIds.size, workflowIds.length);

  await Promise.all(
    [...uniqueTaskIds].map((taskId, index) =>
      client.reportResult({
        request_id: `req-chaos-report-${index}`,
        workflow_id: taskId.split(":task:")[0],
        task_id: taskId,
        success: true,
        result_json: new Uint8Array(),
      }),
    ),
  );

  for (const workflowId of workflowIds) {
    const workflow = await orchestrator.workflowRepository.getWorkflow(workflowId);
    assert.equal(workflow?.state, "succeeded");
  }

  await server.stop();
});
