import assert from "node:assert/strict";
import test from "node:test";

import { RuntimeGrpcServiceClient } from "../../src/core/runtime/grpc/client";
import { createRuntimeGrpcServerWithLocalOrchestrator } from "../../src/core/runtime/grpc/server";

test("ReportResult persists terminal and non-terminal outcomes deterministically", async () => {
  const { server, orchestrator } = createRuntimeGrpcServerWithLocalOrchestrator();
  await server.start();
  const client = new RuntimeGrpcServiceClient(server);

  await client.submitPlan({
    request_id: "req-report-1",
    workflow_id: "wf-report-1",
    tenant_id: "tenant-a",
    intent: "retry flow",
  });

  const leased = await client.leaseNextTask({
    request_id: "req-report-2",
    worker_id: "worker-a",
    worker_capabilities_json: "{}",
  });
  const leasedTaskId = leased.task?.task_id;
  assert.equal(typeof leasedTaskId, "string");
  if (leasedTaskId === undefined) {
    throw new Error("expected leased task");
  }

  const retryableFailure = await client.reportResult({
    request_id: "req-report-3",
    workflow_id: "wf-report-1",
    task_id: leasedTaskId,
    success: false,
    result_json: new Uint8Array(),
    error: {
      code: "DEPENDENCY_FAILURE",
      message: "temporary",
      retryable: true,
      request_id: "req-report-3",
    },
  });
  assert.equal(retryableFailure.ok, true);

  const taskAfterRetry = await orchestrator.taskRepository.getTask(leasedTaskId);
  assert.equal(taskAfterRetry?.state, "retry_wait");

  await orchestrator.taskRepository.requeueDueRetries(Date.now() + 60_000);

  const leaseAgain = await client.leaseNextTask({
    request_id: "req-report-4",
    worker_id: "worker-a",
    worker_capabilities_json: "{}",
  });
  assert.equal(leaseAgain.task?.task_id, leasedTaskId);

  const success = await client.reportResult({
    request_id: "req-report-5",
    workflow_id: "wf-report-1",
    task_id: leasedTaskId,
    success: true,
    result_json: new Uint8Array(),
  });
  assert.equal(success.ok, true);

  const workflow = await orchestrator.workflowRepository.getWorkflow("wf-report-1");
  assert.equal(workflow?.state, "succeeded");

  await server.stop();
});
