import assert from "node:assert/strict";
import test from "node:test";

import { RuntimeGrpcServiceClient } from "../../src/core/runtime/grpc/client";
import { createRuntimeGrpcServerWithLocalOrchestrator } from "../../src/core/runtime/grpc/server";

test("artifact registration persists immutable workflow linkage", async () => {
  const { server, orchestrator } = createRuntimeGrpcServerWithLocalOrchestrator();
  await server.start();
  const client = new RuntimeGrpcServiceClient(server);

  await client.submitPlan({
    request_id: "req-art-1",
    workflow_id: "wf-art-1",
    tenant_id: "tenant-a",
    intent: "artifact flow",
  });

  const ack = await client.registerArtifact({
    request_id: "req-art-2",
    workflow_id: "wf-art-1",
    task_id: "wf-art-1:task:0001",
    uri: "file:///tmp/evidence.json",
    digest: "sha256:abc",
  });
  assert.equal(ack.ok, true);

  const artifacts = await orchestrator.artifactRepository.listArtifactsByWorkflow("wf-art-1");
  assert.equal(artifacts.length, 1);
  assert.equal(artifacts[0].workflow_id, "wf-art-1");

  const wrongWorkflow = await client.registerArtifact({
    request_id: "req-art-3",
    workflow_id: "wf-other",
    task_id: "wf-art-1:task:0001",
    uri: "file:///tmp/evidence-2.json",
    digest: "sha256:def",
  });
  assert.equal(wrongWorkflow.ok, false);
  assert.equal(wrongWorkflow.error?.code, "POLICY_DENIED");

  await server.stop();
});
