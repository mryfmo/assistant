import assert from "node:assert/strict";
import test from "node:test";

import { RuntimeGrpcNetworkClient } from "../../src/core/runtime/grpc/client";
import { RuntimeGrpcNetworkServer } from "../../src/core/runtime/grpc/network-server";
import { RuntimeGrpcServiceServer } from "../../src/core/runtime/grpc/server";
import { createMtlsConfig } from "./mtls-fixture";

test("staging/prod reject non-mTLS and accept valid mTLS peers only", async () => {
  const serviceServer = new RuntimeGrpcServiceServer({
    handlers: {
      plan: {
        submitPlan: () => ({ ok: true }),
      },
    },
  });
  const networkServer = new RuntimeGrpcNetworkServer({
    bindAddress: "127.0.0.1:0",
    serviceServer,
    config: createMtlsConfig({ env: "prod" }),
  });

  const handle = await networkServer.start();

  const insecureClient = new RuntimeGrpcNetworkClient({
    address: `127.0.0.1:${handle.boundPort}`,
  });

  const rejected = await insecureClient.submitPlan({
    request_id: "req-mtls-1",
    workflow_id: "wf-mtls-1",
    tenant_id: "tenant-a",
    intent: "mtls check",
  });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.error?.code, "UNAUTHORIZED");
  insecureClient.close();

  const mtlsClient = new RuntimeGrpcNetworkClient({
    address: `grpcs://127.0.0.1:${handle.boundPort}`,
    config: createMtlsConfig({ env: "prod" }),
  });

  const accepted = await mtlsClient.submitPlan({
    request_id: "req-mtls-2",
    workflow_id: "wf-mtls-2",
    tenant_id: "tenant-a",
    intent: "mtls check",
  });
  assert.equal(accepted.ok, true);
  mtlsClient.close();

  await networkServer.stop();
});
