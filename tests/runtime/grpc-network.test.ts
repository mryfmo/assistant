import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";

import * as grpc from "@grpc/grpc-js";
import { loadSync } from "@grpc/proto-loader";

import { RuntimeGrpcNetworkServer } from "../../src/core/runtime/grpc/network-server";
import { RuntimeGrpcServiceServer } from "../../src/core/runtime/grpc/server";

type PlanServiceClient = grpc.Client & {
  SubmitPlan(
    request: Record<string, unknown>,
    callback: (error: grpc.ServiceError | null, response: Record<string, unknown>) => void,
  ): void;
  SubmitPlan(
    request: Record<string, unknown>,
    metadata: grpc.Metadata,
    callback: (error: grpc.ServiceError | null, response: Record<string, unknown>) => void,
  ): void;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return value as Record<string, unknown>;
}

function isGrpcObject(value: unknown): value is grpc.GrpcObject {
  return typeof value === "object" && value !== null;
}

function isServiceConstructor(value: unknown): value is grpc.ServiceClientConstructor {
  return typeof value === "function" && "service" in value;
}

function createPlanClient(port: number): PlanServiceClient {
  const definition = loadSync(
    resolve(process.cwd(), "contracts/proto/orchestrator/v1/orchestrator.proto"),
    {
      keepCase: true,
      longs: Number,
      enums: String,
      defaults: false,
      oneofs: false,
    },
  );
  const grpcObject = grpc.loadPackageDefinition(definition);
  const orchestratorNamespace = grpcObject.orchestrator;
  if (!isGrpcObject(orchestratorNamespace)) {
    throw new Error("orchestrator namespace missing in loaded proto definition");
  }

  const versionNamespace = orchestratorNamespace.v1;
  if (!isGrpcObject(versionNamespace)) {
    throw new Error("orchestrator.v1 namespace missing in loaded proto definition");
  }

  const planService = versionNamespace.PlanService;
  if (!isServiceConstructor(planService)) {
    throw new Error("PlanService constructor missing in loaded proto definition");
  }

  const client = new planService(
    `127.0.0.1:${port}`,
    grpc.credentials.createInsecure(),
  ) as unknown as PlanServiceClient;

  return client;
}

function submitPlan(
  client: PlanServiceClient,
  request: Record<string, unknown>,
  metadata?: grpc.Metadata,
): Promise<Record<string, unknown>> {
  return new Promise((resolveResponse, rejectResponse) => {
    const callback = (error: grpc.ServiceError | null, response: Record<string, unknown>) => {
      if (error !== null) {
        rejectResponse(error);
        return;
      }

      resolveResponse(response);
    };

    if (metadata === undefined) {
      client.SubmitPlan(request, callback);
      return;
    }

    client.SubmitPlan(request, metadata, callback);
  });
}

test("RuntimeGrpcNetworkServer starts and accepts valid major-version requests", async () => {
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
  });

  const handle = await networkServer.start();
  const client = createPlanClient(handle.boundPort);

  try {
    const metadata = new grpc.Metadata();
    metadata.set("x-contract-major", "1");
    const response = await submitPlan(
      client,
      {
        request_id: "req-net-1",
        workflow_id: "wf-net-1",
        tenant_id: "tenant-net",
        intent: "network-test",
      },
      metadata,
    );

    const responseRecord = asRecord(response);
    assert.equal(responseRecord.ok, true);
  } finally {
    client.close();
    await networkServer.stop();
  }
});

test("RuntimeGrpcNetworkServer rejects contract-major mismatch over network", async () => {
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
  });

  const handle = await networkServer.start();
  const client = createPlanClient(handle.boundPort);

  try {
    const metadata = new grpc.Metadata();
    metadata.set("x-contract-major", "9");
    const response = await submitPlan(
      client,
      {
        request_id: "req-net-2",
        workflow_id: "wf-net-2",
        tenant_id: "tenant-net",
        intent: "network-test",
      },
      metadata,
    );

    const responseRecord = asRecord(response);
    const errorRecord = asRecord(responseRecord.error);
    assert.equal(responseRecord.ok, false);
    assert.equal(errorRecord.code, "CONTRACT_MISMATCH");
  } finally {
    client.close();
    await networkServer.stop();
  }
});

test("RuntimeGrpcNetworkServer rejects invalid requests over network", async () => {
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
  });

  const handle = await networkServer.start();
  const client = createPlanClient(handle.boundPort);

  try {
    const response = await submitPlan(client, {
      request_id: "",
      workflow_id: "wf-net-3",
      tenant_id: "tenant-net",
      intent: "network-test",
    });

    const responseRecord = asRecord(response);
    const errorRecord = asRecord(responseRecord.error);
    assert.equal(responseRecord.ok, false);
    assert.equal(errorRecord.code, "INVALID_REQUEST");
  } finally {
    client.close();
    await networkServer.stop();
  }
});
