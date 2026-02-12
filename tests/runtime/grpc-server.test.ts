import assert from "node:assert/strict";
import test from "node:test";

import { RuntimeGrpcServiceClient } from "../../src/core/runtime/grpc/client";
import { RuntimeGrpcServiceServer } from "../../src/core/runtime/grpc/server";

test("RuntimeGrpcServiceServer returns service-not-started before startup", async () => {
  const server = new RuntimeGrpcServiceServer();
  const client = new RuntimeGrpcServiceClient(server);

  const response = await client.submitPlan({
    request_id: "req-090",
    workflow_id: "wf-090",
    tenant_id: "tenant-a",
    intent: "test",
  });

  assert.equal(response.ok, false);
  assert.equal(response.error?.code, "INTERNAL_ERROR");
  assert.equal(response.error?.request_id, "req-090");
});

test("RuntimeGrpcServiceServer default handlers return deterministic not-implemented errors", async () => {
  const server = new RuntimeGrpcServiceServer();
  await server.start();
  const client = new RuntimeGrpcServiceClient(server);

  const response = await client.submitPlan({
    request_id: "req-100",
    workflow_id: "wf-100",
    tenant_id: "tenant-a",
    intent: "test",
  });

  assert.equal(response.ok, false);
  assert.equal(response.error?.code, "INTERNAL_ERROR");
  assert.equal(response.error?.request_id, "req-100");
});

test("RuntimeGrpcServiceServer uses provided handler overrides", async () => {
  const server = new RuntimeGrpcServiceServer({
    handlers: {
      plan: {
        submitPlan: (request) => ({ ok: request.workflow_id === "wf-200" }),
      },
    },
  });
  await server.start();
  const client = new RuntimeGrpcServiceClient(server);

  const response = await client.submitPlan({
    request_id: "req-200",
    workflow_id: "wf-200",
    tenant_id: "tenant-a",
    intent: "test",
  });

  assert.equal(response.ok, true);
  assert.equal(response.error, undefined);
});

test("RuntimeGrpcServiceServer rejects invalid requests deterministically", async () => {
  const server = new RuntimeGrpcServiceServer({
    handlers: {
      plan: {
        submitPlan: () => ({ ok: true }),
      },
    },
  });
  await server.start();
  const client = new RuntimeGrpcServiceClient(server);

  const response = await client.submitPlan({
    request_id: "",
    workflow_id: "wf-300",
    tenant_id: "tenant-a",
    intent: "test",
  });

  assert.equal(response.ok, false);
  assert.equal(response.error?.code, "INVALID_REQUEST");
  assert.equal(response.error?.request_id, "request-id-unavailable");
});

test("RuntimeGrpcServiceServer rejects contract-major mismatch deterministically", async () => {
  const server = new RuntimeGrpcServiceServer({
    handlers: {
      plan: {
        submitPlan: () => ({ ok: true }),
      },
    },
  });
  await server.start();
  const client = new RuntimeGrpcServiceClient(server);

  const response = await client.submitPlan(
    {
      request_id: "req-400",
      workflow_id: "wf-400",
      tenant_id: "tenant-a",
      intent: "test",
    },
    {
      contractMajor: 99,
    },
  );

  assert.equal(response.ok, false);
  assert.equal(response.error?.code, "CONTRACT_MISMATCH");
  assert.equal(response.error?.request_id, "req-400");
});

test("RuntimeGrpcServiceServer applies contract-major checks across all service entrypoints", async () => {
  const server = new RuntimeGrpcServiceServer({
    handlers: {
      plan: {
        submitPlan: () => ({ ok: true }),
      },
      worker: {
        leaseNextTask: () => ({}),
        renewLease: () => ({ ok: true }),
        reportEvent: () => ({ ok: true }),
        reportResult: () => ({ ok: true }),
      },
      artifact: {
        registerArtifact: () => ({ ok: true }),
      },
      admin: {
        cancelWorkflow: () => ({ ok: true }),
      },
    },
  });
  await server.start();
  const client = new RuntimeGrpcServiceClient(server);
  const mismatch = { contractMajor: 2 };

  const submitPlan = await client.submitPlan(
    {
      request_id: "req-501",
      workflow_id: "wf-501",
      tenant_id: "tenant-a",
      intent: "test",
    },
    mismatch,
  );
  const leaseNextTask = await client.leaseNextTask(
    {
      request_id: "req-502",
      worker_id: "worker-1",
      worker_capabilities_json: "{}",
    },
    mismatch,
  );
  const renewLease = await client.renewLease(
    {
      request_id: "req-503",
      task_id: "task-1",
      worker_id: "worker-1",
      expires_unix_ms: Date.now() + 60_000,
    },
    mismatch,
  );
  const reportEvent = await client.reportEvent(
    {
      request_id: "req-504",
      workflow_id: "wf-504",
      task_id: "task-1",
      event_type: "TASK_EVENT_TYPE_PROGRESS",
      message: "progress",
      timestamp_unix_ms: Date.now(),
    },
    mismatch,
  );
  const reportResult = await client.reportResult(
    {
      request_id: "req-505",
      workflow_id: "wf-505",
      task_id: "task-1",
      success: true,
      result_json: new Uint8Array(),
    },
    mismatch,
  );
  const registerArtifact = await client.registerArtifact(
    {
      request_id: "req-506",
      workflow_id: "wf-506",
      task_id: "task-1",
      uri: "file:///tmp/evidence.json",
      digest: "abc123",
    },
    mismatch,
  );
  const cancelWorkflow = await client.cancelWorkflow(
    {
      request_id: "req-507",
      workflow_id: "wf-507",
      tenant_id: "tenant-a",
      intent: "cancel",
    },
    mismatch,
  );

  assert.equal(submitPlan.error?.code, "CONTRACT_MISMATCH");
  assert.equal(leaseNextTask.error?.code, "CONTRACT_MISMATCH");
  assert.equal(renewLease.error?.code, "CONTRACT_MISMATCH");
  assert.equal(reportEvent.error?.code, "CONTRACT_MISMATCH");
  assert.equal(reportResult.error?.code, "CONTRACT_MISMATCH");
  assert.equal(registerArtifact.error?.code, "CONTRACT_MISMATCH");
  assert.equal(cancelWorkflow.error?.code, "CONTRACT_MISMATCH");
});
