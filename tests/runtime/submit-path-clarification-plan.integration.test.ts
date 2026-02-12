import assert from "node:assert/strict";
import test from "node:test";

import { RuntimeGrpcServiceClient } from "../../src/core/runtime/grpc/client";
import { createRuntimeGrpcServerWithLocalOrchestrator } from "../../src/core/runtime/grpc/server";

test("submit path blocks ambiguous/high-risk intent before persistence", async () => {
  const { server, orchestrator } = createRuntimeGrpcServerWithLocalOrchestrator();
  await server.start();
  const client = new RuntimeGrpcServiceClient(server);

  const blocked = await client.submitPlan({
    request_id: "req-submit-blocked-1",
    workflow_id: "wf-submit-blocked-1",
    tenant_id: "tenant-a",
    intent: "maybe delete production credentials",
  });

  assert.equal(blocked.ok, false);
  assert.equal(blocked.error?.code, "POLICY_DENIED");

  const workflow = await orchestrator.workflowRepository.getWorkflow("wf-submit-blocked-1");
  assert.equal(workflow, undefined);

  await server.stop();
});

test("submit path persists deterministic plan graph with clear intent", async () => {
  const { server, orchestrator } = createRuntimeGrpcServerWithLocalOrchestrator();
  await server.start();
  const client = new RuntimeGrpcServiceClient(server);

  const accepted = await client.submitPlan({
    request_id: "req-submit-plan-1",
    workflow_id: "wf-submit-plan-1",
    tenant_id: "tenant-a",
    intent: "run deterministic clear task",
  });
  assert.equal(accepted.ok, true);

  const tasks = await orchestrator.taskRepository.listTasksByWorkflow("wf-submit-plan-1");
  assert.equal(tasks.length, 1);

  const payload = JSON.parse(new TextDecoder().decode(tasks[0].spec_json)) as {
    intent: string;
    plan_graph_json: string;
  };

  assert.equal(payload.intent, "run deterministic clear task");
  const graph = JSON.parse(payload.plan_graph_json) as {
    workflow_id: string;
    nodes: Array<{ id: string; kind: string }>;
    edges: Array<{ from: string; to: string }>;
  };

  assert.equal(graph.workflow_id, "wf-submit-plan-1");
  assert.equal(
    graph.nodes.some((node) => node.id === "plan:analyze" && node.kind === "plan"),
    true,
  );
  assert.equal(
    graph.nodes.some((node) => node.id === "task:execute" && node.kind === "task"),
    true,
  );

  await server.stop();
});
