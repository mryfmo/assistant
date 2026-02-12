import assert from "node:assert/strict";
import test from "node:test";

import { RuntimeGrpcServiceClient } from "../../src/core/runtime/grpc/client";
import { createRuntimeGrpcServerWithLocalOrchestrator } from "../../src/core/runtime/grpc/server";
import { assertSandboxDryRunEvidence } from "../../src/core/skills/sandbox-dryrun";

test("promotion eligibility is unreachable without valid sandbox dry-run evidence", async () => {
  const { server, orchestrator } = createRuntimeGrpcServerWithLocalOrchestrator();
  await server.start();
  const client = new RuntimeGrpcServiceClient(server);

  const submit = await client.submitPlan({
    request_id: "req-sandbox-1",
    workflow_id: "wf-sandbox-1",
    tenant_id: "tenant-a",
    intent: "sandbox dry-run",
  });
  assert.equal(submit.ok, true);

  const nonEvidence = await client.registerArtifact({
    request_id: "req-sandbox-2",
    workflow_id: "wf-sandbox-1",
    task_id: "wf-sandbox-1:task:0001",
    uri: "file:///tmp/output.json",
    digest: "abc123",
  });
  assert.equal(nonEvidence.ok, true);

  const firstArtifacts =
    await orchestrator.artifactRepository.listArtifactsByWorkflow("wf-sandbox-1");
  const missingEvidence = assertSandboxDryRunEvidence(firstArtifacts);
  assert.equal(missingEvidence.ok, false);

  const invalidEvidence = await client.registerArtifact({
    request_id: "req-sandbox-3",
    workflow_id: "wf-sandbox-1",
    task_id: "wf-sandbox-1:task:0001",
    uri: "evidence://sandbox/dry-run/run-1",
    digest: "abc123",
  });
  assert.equal(invalidEvidence.ok, false);
  assert.equal(invalidEvidence.error?.code, "POLICY_DENIED");

  const validEvidence = await client.registerArtifact({
    request_id: "req-sandbox-4",
    workflow_id: "wf-sandbox-1",
    task_id: "wf-sandbox-1:task:0001",
    uri: "evidence://sandbox/dry-run/run-1",
    digest: "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  });
  assert.equal(validEvidence.ok, true);

  const secondArtifacts =
    await orchestrator.artifactRepository.listArtifactsByWorkflow("wf-sandbox-1");
  const hasEvidence = assertSandboxDryRunEvidence(secondArtifacts);
  assert.equal(hasEvidence.ok, true);

  await server.stop();
});
