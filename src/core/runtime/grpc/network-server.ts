import { resolve } from "node:path";

import * as grpc from "@grpc/grpc-js";
import { loadSync } from "@grpc/proto-loader";

import { type RuntimeConfig, loadRuntimeConfig } from "../config";
import type {
  ArtifactRef,
  Lease,
  LeaseRequest,
  PlanRun,
  TaskEvent,
  TaskResult,
} from "./orchestrator-v1";
import { RuntimeGrpcServiceServer } from "./server";
import { createServerCredentials, usesMetadataMtlsFallback } from "./tls-config";
import type { GrpcTransportMetadata } from "./validation";

type ServiceConstructors = {
  planService: grpc.ServiceClientConstructor;
  workerService: grpc.ServiceClientConstructor;
  artifactService: grpc.ServiceClientConstructor;
  adminService: grpc.ServiceClientConstructor;
};

export type RuntimeGrpcNetworkServerOptions = {
  bindAddress: string;
  orchestratorProtoPath?: string;
  serviceServer?: RuntimeGrpcServiceServer;
  config?: RuntimeConfig;
};

export type RuntimeGrpcServerHandle = {
  boundPort: number;
};

type UnaryCall = grpc.ServerUnaryCall<Record<string, unknown>, Record<string, unknown>>;
type UnaryCallback = grpc.sendUnaryData<Record<string, unknown>>;

function isGrpcObject(value: unknown): value is grpc.GrpcObject {
  return typeof value === "object" && value !== null;
}

function isServiceConstructor(value: unknown): value is grpc.ServiceClientConstructor {
  return typeof value === "function" && "service" in value;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value === "string") {
    return value;
  }

  return "";
}

function readNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return 0;
}

function readBoolean(record: Record<string, unknown>, key: string): boolean {
  const value = record[key];
  if (typeof value === "boolean") {
    return value;
  }

  return false;
}

function readBytes(record: Record<string, unknown>, key: string): Uint8Array {
  const value = record[key];
  if (value instanceof Uint8Array) {
    return value;
  }

  if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) {
    return value;
  }

  return new Uint8Array();
}

function parseContractMajor(metadata: grpc.Metadata): GrpcTransportMetadata {
  const values = metadata.get("x-contract-major");
  const first = values[0];

  if (first === undefined) {
    return {};
  }

  let raw = "";
  if (typeof first === "string") {
    raw = first;
  } else {
    raw = first.toString("utf-8");
  }

  const parsed = Number(raw.trim());
  return { contractMajor: parsed };
}

function parseMtlsMetadata(metadata: grpc.Metadata): { authenticated: boolean; peerId?: string } {
  const authenticatedValue = metadata.get("x-mtls-authenticated")[0];
  const peerValue = metadata.get("x-mtls-peer-id")[0];

  const authenticated =
    typeof authenticatedValue === "string"
      ? authenticatedValue === "true"
      : authenticatedValue?.toString("utf-8") === "true";

  const peerId =
    typeof peerValue === "string"
      ? peerValue
      : peerValue === undefined
        ? undefined
        : peerValue.toString("utf-8");

  return {
    authenticated,
    peerId,
  };
}

function toPlanRun(input: unknown): PlanRun {
  const record = asRecord(input);
  return {
    request_id: readString(record, "request_id"),
    workflow_id: readString(record, "workflow_id"),
    tenant_id: readString(record, "tenant_id"),
    intent: readString(record, "intent"),
  };
}

function toLeaseRequest(input: unknown): LeaseRequest {
  const record = asRecord(input);
  return {
    request_id: readString(record, "request_id"),
    worker_id: readString(record, "worker_id"),
    worker_capabilities_json: readString(record, "worker_capabilities_json"),
  };
}

function toLease(input: unknown): Lease {
  const record = asRecord(input);
  return {
    request_id: readString(record, "request_id"),
    task_id: readString(record, "task_id"),
    worker_id: readString(record, "worker_id"),
    expires_unix_ms: readNumber(record, "expires_unix_ms"),
  };
}

function toTaskEvent(input: unknown): TaskEvent {
  const record = asRecord(input);
  const eventType = readString(record, "event_type");
  return {
    request_id: readString(record, "request_id"),
    workflow_id: readString(record, "workflow_id"),
    task_id: readString(record, "task_id"),
    event_type:
      eventType.length > 0 ? (eventType as TaskEvent["event_type"]) : "TASK_EVENT_TYPE_UNSPECIFIED",
    message: readString(record, "message"),
    timestamp_unix_ms: readNumber(record, "timestamp_unix_ms"),
  };
}

function toTaskResult(input: unknown): TaskResult {
  const record = asRecord(input);
  return {
    request_id: readString(record, "request_id"),
    workflow_id: readString(record, "workflow_id"),
    task_id: readString(record, "task_id"),
    success: readBoolean(record, "success"),
    result_json: readBytes(record, "result_json"),
  };
}

function toArtifactRef(input: unknown): ArtifactRef {
  const record = asRecord(input);
  return {
    request_id: readString(record, "request_id"),
    workflow_id: readString(record, "workflow_id"),
    task_id: readString(record, "task_id"),
    uri: readString(record, "uri"),
    digest: readString(record, "digest"),
  };
}

function resolveServiceConstructors(orchestratorProtoPath: string): ServiceConstructors {
  const definition = loadSync(orchestratorProtoPath, {
    keepCase: true,
    longs: Number,
    enums: String,
    defaults: false,
    oneofs: false,
  });

  const grpcObject = grpc.loadPackageDefinition(definition);
  const orchestratorNamespace = grpcObject.orchestrator;
  if (!isGrpcObject(orchestratorNamespace)) {
    throw new Error("Invalid proto package: expected orchestrator namespace.");
  }

  const versionNamespace = orchestratorNamespace.v1;
  if (!isGrpcObject(versionNamespace)) {
    throw new Error("Invalid proto package: expected orchestrator.v1 namespace.");
  }

  const planService = versionNamespace.PlanService;
  const workerService = versionNamespace.WorkerService;
  const artifactService = versionNamespace.ArtifactService;
  const adminService = versionNamespace.AdminService;

  if (!isServiceConstructor(planService)) {
    throw new Error("Invalid proto package: PlanService constructor missing.");
  }
  if (!isServiceConstructor(workerService)) {
    throw new Error("Invalid proto package: WorkerService constructor missing.");
  }
  if (!isServiceConstructor(artifactService)) {
    throw new Error("Invalid proto package: ArtifactService constructor missing.");
  }
  if (!isServiceConstructor(adminService)) {
    throw new Error("Invalid proto package: AdminService constructor missing.");
  }

  return {
    planService,
    workerService,
    artifactService,
    adminService,
  };
}

export class RuntimeGrpcNetworkServer {
  private readonly bindAddress: string;
  private readonly serviceServer: RuntimeGrpcServiceServer;
  private readonly grpcServer: grpc.Server;
  private readonly orchestratorProtoPath: string;
  private readonly config: RuntimeConfig;
  private boundPort?: number;

  constructor(options: RuntimeGrpcNetworkServerOptions) {
    this.bindAddress = options.bindAddress;
    this.serviceServer = options.serviceServer ?? new RuntimeGrpcServiceServer();
    this.grpcServer = new grpc.Server();
    this.orchestratorProtoPath =
      options.orchestratorProtoPath ??
      resolve(process.cwd(), "contracts/proto/orchestrator/v1/orchestrator.proto");
    this.config = options.config ?? loadRuntimeConfig({});

    this.registerServices();
  }

  private registerServices(): void {
    const constructors = resolveServiceConstructors(this.orchestratorProtoPath);

    this.grpcServer.addService(constructors.planService.service, {
      SubmitPlan: (call: UnaryCall, callback: UnaryCallback) => {
        const request = toPlanRun(call.request);
        if (!this.isMtlsAccepted(call.metadata)) {
          callback(null, {
            ok: false,
            error: {
              code: "UNAUTHORIZED",
              message: "mTLS authentication is required for this environment.",
              request_id: request.request_id,
              retryable: false,
            },
          });
          return;
        }

        void this.serviceServer
          .submitPlan(request, parseContractMajor(call.metadata))
          .then((response) => callback(null, response))
          .catch((error: unknown) => callback(error as Error, null));
      },
    });

    this.grpcServer.addService(constructors.workerService.service, {
      LeaseNextTask: (call: UnaryCall, callback: UnaryCallback) => {
        const request = toLeaseRequest(call.request);
        if (!this.isMtlsAccepted(call.metadata)) {
          callback(null, {
            error: {
              code: "UNAUTHORIZED",
              message: "mTLS authentication is required for this environment.",
              request_id: request.request_id,
              retryable: false,
            },
          });
          return;
        }

        void this.serviceServer
          .leaseNextTask(request, parseContractMajor(call.metadata))
          .then((response) => callback(null, response))
          .catch((error: unknown) => callback(error as Error, null));
      },
      RenewLease: (call: UnaryCall, callback: UnaryCallback) => {
        const request = toLease(call.request);
        if (!this.isMtlsAccepted(call.metadata)) {
          callback(null, {
            ok: false,
            error: {
              code: "UNAUTHORIZED",
              message: "mTLS authentication is required for this environment.",
              request_id: request.request_id,
              retryable: false,
            },
          });
          return;
        }

        void this.serviceServer
          .renewLease(request, parseContractMajor(call.metadata))
          .then((response) => callback(null, response))
          .catch((error: unknown) => callback(error as Error, null));
      },
      ReportEvent: (call: UnaryCall, callback: UnaryCallback) => {
        const request = toTaskEvent(call.request);
        if (!this.isMtlsAccepted(call.metadata)) {
          callback(null, {
            ok: false,
            error: {
              code: "UNAUTHORIZED",
              message: "mTLS authentication is required for this environment.",
              request_id: request.request_id,
              retryable: false,
            },
          });
          return;
        }

        void this.serviceServer
          .reportEvent(request, parseContractMajor(call.metadata))
          .then((response) => callback(null, response))
          .catch((error: unknown) => callback(error as Error, null));
      },
      ReportResult: (call: UnaryCall, callback: UnaryCallback) => {
        const request = toTaskResult(call.request);
        if (!this.isMtlsAccepted(call.metadata)) {
          callback(null, {
            ok: false,
            error: {
              code: "UNAUTHORIZED",
              message: "mTLS authentication is required for this environment.",
              request_id: request.request_id,
              retryable: false,
            },
          });
          return;
        }

        void this.serviceServer
          .reportResult(request, parseContractMajor(call.metadata))
          .then((response) => callback(null, response))
          .catch((error: unknown) => callback(error as Error, null));
      },
    });

    this.grpcServer.addService(constructors.artifactService.service, {
      RegisterArtifact: (call: UnaryCall, callback: UnaryCallback) => {
        const request = toArtifactRef(call.request);
        if (!this.isMtlsAccepted(call.metadata)) {
          callback(null, {
            ok: false,
            error: {
              code: "UNAUTHORIZED",
              message: "mTLS authentication is required for this environment.",
              request_id: request.request_id,
              retryable: false,
            },
          });
          return;
        }

        void this.serviceServer
          .registerArtifact(request, parseContractMajor(call.metadata))
          .then((response) => callback(null, response))
          .catch((error: unknown) => callback(error as Error, null));
      },
    });

    this.grpcServer.addService(constructors.adminService.service, {
      CancelWorkflow: (call: UnaryCall, callback: UnaryCallback) => {
        const request = toPlanRun(call.request);
        if (!this.isMtlsAccepted(call.metadata)) {
          callback(null, {
            ok: false,
            error: {
              code: "UNAUTHORIZED",
              message: "mTLS authentication is required for this environment.",
              request_id: request.request_id,
              retryable: false,
            },
          });
          return;
        }

        void this.serviceServer
          .cancelWorkflow(request, parseContractMajor(call.metadata))
          .then((response) => callback(null, response))
          .catch((error: unknown) => callback(error as Error, null));
      },
    });
  }

  async start(): Promise<RuntimeGrpcServerHandle> {
    await this.serviceServer.start();

    const boundPort = await new Promise<number>((resolveBind, rejectBind) => {
      const serverCredentials = createServerCredentials(this.config);
      this.grpcServer.bindAsync(this.bindAddress, serverCredentials, (error, port) => {
        if (error !== null) {
          rejectBind(error);
          return;
        }

        resolveBind(port);
      });
    });

    this.boundPort = boundPort;

    return { boundPort };
  }

  async stop(): Promise<void> {
    await this.serviceServer.stop();

    await new Promise<void>((resolveShutdown, rejectShutdown) => {
      this.grpcServer.tryShutdown((error) => {
        if (error !== undefined) {
          rejectShutdown(error);
          return;
        }

        resolveShutdown();
      });
    });

    this.boundPort = undefined;
  }

  getBoundPort(): number | undefined {
    return this.boundPort;
  }

  private isMtlsAccepted(metadata: grpc.Metadata): boolean {
    if (!this.config.requireMtls) {
      return true;
    }

    if (!usesMetadataMtlsFallback(this.config)) {
      return true;
    }

    const mtls = parseMtlsMetadata(metadata);
    return mtls.authenticated && (mtls.peerId?.trim().length ?? 0) > 0;
  }
}
