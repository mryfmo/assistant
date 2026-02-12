import assert from "node:assert/strict";
import test from "node:test";

import { RuntimeGrpcNetworkClient } from "../../src/core/runtime/grpc/client";
import { RuntimeGrpcNetworkServer } from "../../src/core/runtime/grpc/network-server";
import { RuntimeGrpcServiceServer } from "../../src/core/runtime/grpc/server";
import { createMtlsConfig } from "./mtls-fixture";

test("M11 transport-level mTLS rejects non-mTLS connections when fallback is disabled", async () => {
  if (
    typeof process.versions.bun === "string" &&
    process.env.ORCH_ENABLE_TRANSPORT_MTLS_TEST !== "true"
  ) {
    return;
  }

  const serviceServer = new RuntimeGrpcServiceServer({
    handlers: {
      plan: {
        submitPlan: () => ({ ok: true }),
      },
    },
  });

  const secureConfig = createMtlsConfig({
    env: "prod",
    allowMtlsMetadataFallback: false,
  });

  const networkServer = new RuntimeGrpcNetworkServer({
    bindAddress: "127.0.0.1:0",
    serviceServer,
    config: secureConfig,
  });

  const { boundPort } = await networkServer.start();

  const insecureClient = new RuntimeGrpcNetworkClient({
    address: `localhost:${boundPort}`,
  });

  await assert.rejects(
    () =>
      insecureClient.submitPlan({
        request_id: "req-mtls-transport-1",
        workflow_id: "wf-mtls-transport-1",
        tenant_id: "tenant-a",
        intent: "transport-level rejection check",
      }),
    /UNAVAILABLE|TLS|SSL|handshake|socket/i,
  );
  insecureClient.close();

  const secureClient = new RuntimeGrpcNetworkClient({
    address: `grpcs://localhost:${boundPort}`,
    config: secureConfig,
  });

  const accepted = await secureClient.submitPlan({
    request_id: "req-mtls-transport-2",
    workflow_id: "wf-mtls-transport-2",
    tenant_id: "tenant-a",
    intent: "transport-level acceptance check",
  });
  assert.equal(accepted.ok, true);

  secureClient.close();
  await networkServer.stop();
});
