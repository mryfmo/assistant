import assert from "node:assert/strict";
import test from "node:test";

import { RuntimeGrpcServiceClient } from "../../src/core/runtime/grpc/client";
import { createRuntimeGrpcServerWithLocalOrchestrator } from "../../src/core/runtime/grpc/server";

test("SubmitPlan persists workflow and tasks deterministically", async () => {
  const { server, orchestrator } = createRuntimeGrpcServerWithLocalOrchestrator();
  await server.start();
  const client = new RuntimeGrpcServiceClient(server);

  const response = await client.submitPlan({
    request_id: "req-submit-1",
    workflow_id: "wf-submit-1",
    tenant_id: "tenant-a",
    intent: "run a local slice",
  });

  assert.equal(response.ok, true);

  const workflow = await orchestrator.workflowRepository.getWorkflow("wf-submit-1");
  assert.equal(workflow?.workflow_id, "wf-submit-1");

  const tasks = await orchestrator.taskRepository.listTasksByWorkflow("wf-submit-1");
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].task_id, "wf-submit-1:task:0001");

  const duplicate = await client.submitPlan({
    request_id: "req-submit-2",
    workflow_id: "wf-submit-1",
    tenant_id: "tenant-a",
    intent: "duplicate",
  });
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.error?.code, "POLICY_DENIED");

  await server.stop();
});
