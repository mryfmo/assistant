import assert from "node:assert/strict";
import test from "node:test";

import { RuntimeGrpcServiceClient } from "../../src/core/runtime/grpc/client";
import { RuntimeGrpcServiceServer } from "../../src/core/runtime/grpc/server";

test("unauthorized and forbidden worker requests are rejected with correct semantics", async () => {
  const server = new RuntimeGrpcServiceServer({
    workerAuthorizationPolicy: {
      allowlistByWorkerId: {
        "worker-allowed": { scopes: ["task.dispatch"] },
        "worker-no-scope": { scopes: [] },
      },
    },
    handlers: {
      worker: {
        leaseNextTask: () => ({}),
      },
    },
  });
  await server.start();
  const client = new RuntimeGrpcServiceClient(server);

  const unauthorized = await client.leaseNextTask({
    request_id: "req-authz-1",
    worker_id: "worker-unknown",
    worker_capabilities_json: "{}",
  });
  assert.equal(unauthorized.error?.code, "UNAUTHORIZED");

  const forbidden = await client.leaseNextTask({
    request_id: "req-authz-2",
    worker_id: "worker-no-scope",
    worker_capabilities_json: JSON.stringify({ scopes: ["task.dispatch"] }),
  });
  assert.equal(forbidden.error?.code, "FORBIDDEN");

  const allowed = await client.leaseNextTask({
    request_id: "req-authz-3",
    worker_id: "worker-allowed",
    worker_capabilities_json: JSON.stringify({ scopes: ["task.dispatch"] }),
  });
  assert.equal(allowed.error, undefined);

  await server.stop();
});
