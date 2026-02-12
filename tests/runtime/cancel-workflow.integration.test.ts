import assert from "node:assert/strict";
import test from "node:test";

import { RuntimeGrpcServiceClient } from "../../src/core/runtime/grpc/client";
import { createRuntimeGrpcServerWithLocalOrchestrator } from "../../src/core/runtime/grpc/server";

test("CancelWorkflow performs valid deterministic cancellation and is idempotent", async () => {
  const { server, orchestrator } = createRuntimeGrpcServerWithLocalOrchestrator();
  await server.start();
  const client = new RuntimeGrpcServiceClient(server);

  const submit = await client.submitPlan({
    request_id: "req-cancel-1",
    workflow_id: "wf-cancel-1",
    tenant_id: "tenant-a",
    intent: "cancel me",
  });
  assert.equal(submit.ok, true);

  const firstCancel = await client.cancelWorkflow({
    request_id: "req-cancel-2",
    workflow_id: "wf-cancel-1",
    tenant_id: "tenant-a",
    intent: "cancel",
  });
  assert.equal(firstCancel.ok, true);

  const workflow = await orchestrator.workflowRepository.getWorkflow("wf-cancel-1");
  assert.equal(workflow?.state, "cancelled");

  const tasks = await orchestrator.taskRepository.listTasksByWorkflow("wf-cancel-1");
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0]?.state, "cancelled");

  const secondCancel = await client.cancelWorkflow({
    request_id: "req-cancel-3",
    workflow_id: "wf-cancel-1",
    tenant_id: "tenant-a",
    intent: "cancel",
  });
  assert.equal(secondCancel.ok, true);

  const leaseAfterCancel = await client.leaseNextTask({
    request_id: "req-cancel-4",
    worker_id: "worker-a",
    worker_capabilities_json: "{}",
  });
  assert.equal(leaseAfterCancel.task, undefined);

  await server.stop();
});

test("CancelWorkflow rejects unknown workflow deterministically", async () => {
  const { server } = createRuntimeGrpcServerWithLocalOrchestrator();
  await server.start();
  const client = new RuntimeGrpcServiceClient(server);

  const cancelled = await client.cancelWorkflow({
    request_id: "req-cancel-missing-1",
    workflow_id: "wf-cancel-missing",
    tenant_id: "tenant-a",
    intent: "cancel",
  });

  assert.equal(cancelled.ok, false);
  assert.equal(cancelled.error?.code, "POLICY_DENIED");

  await server.stop();
});
