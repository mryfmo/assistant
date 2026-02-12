import assert from "node:assert/strict";
import test from "node:test";

import { createRuntimeOrchestrator } from "../../src/core/orchestrator";
import { createOrchestratorServiceHandlers } from "../../src/core/orchestrator";
import { RuntimeGrpcNetworkClient } from "../../src/core/runtime/grpc/client";
import { RuntimeGrpcNetworkServer } from "../../src/core/runtime/grpc/network-server";
import { RuntimeGrpcServiceServer } from "../../src/core/runtime/grpc/server";
import { createMtlsConfig } from "./mtls-fixture";

test("remote worker topology over grpcs:// preserves local execution semantics", async () => {
  const config = createMtlsConfig({ env: "staging" });
  const orchestrator = createRuntimeOrchestrator();
  const serviceServer = new RuntimeGrpcServiceServer({
    handlers: createOrchestratorServiceHandlers(orchestrator, config),
  });

  const networkServer = new RuntimeGrpcNetworkServer({
    bindAddress: "127.0.0.1:0",
    serviceServer,
    config,
  });

  const handle = await networkServer.start();
  const remoteClient = new RuntimeGrpcNetworkClient({
    address: `grpcs://127.0.0.1:${handle.boundPort}`,
    config,
  });

  const submit = await remoteClient.submitPlan({
    request_id: "req-remote-1",
    workflow_id: "wf-remote-1",
    tenant_id: "tenant-a",
    intent: "remote execution",
  });
  assert.equal(submit.ok, true);

  const leased = await remoteClient.leaseNextTask({
    request_id: "req-remote-2",
    worker_id: "worker-remote",
    worker_capabilities_json: JSON.stringify({ scopes: ["task.dispatch"] }),
  });
  assert.equal(leased.error, undefined);
  assert.equal(leased.task?.workflow_id, "wf-remote-1");

  const report = await remoteClient.reportResult({
    request_id: "req-remote-3",
    workflow_id: "wf-remote-1",
    task_id: "wf-remote-1:task:0001",
    success: true,
    result_json: new Uint8Array(),
  });
  assert.equal(report.ok, true);

  const workflow = await orchestrator.workflowRepository.getWorkflow("wf-remote-1");
  assert.equal(workflow?.state, "succeeded");

  remoteClient.close();
  await networkServer.stop();
});
