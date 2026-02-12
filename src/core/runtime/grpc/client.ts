import { basename, resolve } from "node:path";

import * as grpc from "@grpc/grpc-js";
import { loadSync } from "@grpc/proto-loader";

import { type RuntimeConfig, loadRuntimeConfig } from "../config";
import type {
  Ack,
  ArtifactRef,
  Lease,
  LeaseRequest,
  LeaseResponse,
  PlanRun,
  TaskEvent,
  TaskResult,
} from "./orchestrator-v1";
import type { RuntimeGrpcServiceServer } from "./server";
import { createClientCredentials } from "./tls-config";
import type { GrpcTransportMetadata } from "./validation";

export class RuntimeGrpcServiceClient {
  constructor(private readonly server: RuntimeGrpcServiceServer) {}

  submitPlan(request: PlanRun, metadata: GrpcTransportMetadata = {}): Promise<Ack> {
    return this.server.submitPlan(request, metadata);
  }

  leaseNextTask(
    request: LeaseRequest,
    metadata: GrpcTransportMetadata = {},
  ): Promise<LeaseResponse> {
    return this.server.leaseNextTask(request, metadata);
  }

  renewLease(request: Lease, metadata: GrpcTransportMetadata = {}): Promise<Ack> {
    return this.server.renewLease(request, metadata);
  }

  reportEvent(request: TaskEvent, metadata: GrpcTransportMetadata = {}): Promise<Ack> {
    return this.server.reportEvent(request, metadata);
  }

  reportResult(request: TaskResult, metadata: GrpcTransportMetadata = {}): Promise<Ack> {
    return this.server.reportResult(request, metadata);
  }

  registerArtifact(request: ArtifactRef, metadata: GrpcTransportMetadata = {}): Promise<Ack> {
    return this.server.registerArtifact(request, metadata);
  }

  cancelWorkflow(request: PlanRun, metadata: GrpcTransportMetadata = {}): Promise<Ack> {
    return this.server.cancelWorkflow(request, metadata);
  }
}

type PlanServiceClient = grpc.Client & {
  SubmitPlan(
    request: PlanRun,
    metadata: grpc.Metadata,
    callback: (error: grpc.ServiceError | null, response: Ack) => void,
  ): void;
};

type WorkerServiceClient = grpc.Client & {
  LeaseNextTask(
    request: LeaseRequest,
    metadata: grpc.Metadata,
    callback: (error: grpc.ServiceError | null, response: LeaseResponse) => void,
  ): void;
  RenewLease(
    request: Lease,
    metadata: grpc.Metadata,
    callback: (error: grpc.ServiceError | null, response: Ack) => void,
  ): void;
  ReportEvent(
    request: TaskEvent,
    metadata: grpc.Metadata,
    callback: (error: grpc.ServiceError | null, response: Ack) => void,
  ): void;
  ReportResult(
    request: TaskResult,
    metadata: grpc.Metadata,
    callback: (error: grpc.ServiceError | null, response: Ack) => void,
  ): void;
};

type ArtifactServiceClient = grpc.Client & {
  RegisterArtifact(
    request: ArtifactRef,
    metadata: grpc.Metadata,
    callback: (error: grpc.ServiceError | null, response: Ack) => void,
  ): void;
};

type AdminServiceClient = grpc.Client & {
  CancelWorkflow(
    request: PlanRun,
    metadata: grpc.Metadata,
    callback: (error: grpc.ServiceError | null, response: Ack) => void,
  ): void;
};

type ServiceConstructors = {
  planService: grpc.ServiceClientConstructor;
  workerService: grpc.ServiceClientConstructor;
  artifactService: grpc.ServiceClientConstructor;
  adminService: grpc.ServiceClientConstructor;
};

function isGrpcObject(value: unknown): value is grpc.GrpcObject {
  return typeof value === "object" && value !== null;
}

function isServiceConstructor(value: unknown): value is grpc.ServiceClientConstructor {
  return typeof value === "function" && "service" in value;
}

function normalizeTargetAddress(address: string): string {
  if (address.startsWith("grpcs://")) {
    return address.slice("grpcs://".length);
  }

  if (address.startsWith("grpc://")) {
    return address.slice("grpc://".length);
  }

  return address;
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

function metadataFromTransport(
  metadata: GrpcTransportMetadata,
  mtlsPeerId?: string,
): grpc.Metadata {
  const grpcMetadata = new grpc.Metadata();
  if (metadata.contractMajor !== undefined) {
    grpcMetadata.set("x-contract-major", String(metadata.contractMajor));
  }

  if (mtlsPeerId !== undefined) {
    grpcMetadata.set("x-mtls-authenticated", "true");
    grpcMetadata.set("x-mtls-peer-id", mtlsPeerId);
  }

  return grpcMetadata;
}

export type RuntimeGrpcNetworkClientOptions = {
  address: string;
  config?: RuntimeConfig;
  channelCredentials?: grpc.ChannelCredentials;
  orchestratorProtoPath?: string;
};

export class RuntimeGrpcNetworkClient {
  private readonly planClient: PlanServiceClient;
  private readonly workerClient: WorkerServiceClient;
  private readonly artifactClient: ArtifactServiceClient;
  private readonly adminClient: AdminServiceClient;
  private readonly mtlsPeerId?: string;

  constructor(options: RuntimeGrpcNetworkClientOptions) {
    const orchestratorProtoPath =
      options.orchestratorProtoPath ??
      resolve(process.cwd(), "contracts/proto/orchestrator/v1/orchestrator.proto");
    const constructors = resolveServiceConstructors(orchestratorProtoPath);

    const config = options.config ?? loadRuntimeConfig({});
    const channelCredentials = options.channelCredentials ?? createClientCredentials(config);
    const target = normalizeTargetAddress(options.address);
    this.mtlsPeerId =
      config.requireMtls && config.tlsClientCertPath !== undefined
        ? basename(config.tlsClientCertPath)
        : undefined;

    this.planClient = new constructors.planService(
      target,
      channelCredentials,
    ) as unknown as PlanServiceClient;
    this.workerClient = new constructors.workerService(
      target,
      channelCredentials,
    ) as unknown as WorkerServiceClient;
    this.artifactClient = new constructors.artifactService(
      target,
      channelCredentials,
    ) as unknown as ArtifactServiceClient;
    this.adminClient = new constructors.adminService(
      target,
      channelCredentials,
    ) as unknown as AdminServiceClient;
  }

  async submitPlan(request: PlanRun, metadata: GrpcTransportMetadata = {}): Promise<Ack> {
    return new Promise((resolveResponse, rejectResponse) => {
      this.planClient.SubmitPlan(
        request,
        metadataFromTransport(metadata, this.mtlsPeerId),
        (error, response) => {
          if (error !== null) {
            rejectResponse(error);
            return;
          }
          resolveResponse(response);
        },
      );
    });
  }

  async leaseNextTask(
    request: LeaseRequest,
    metadata: GrpcTransportMetadata = {},
  ): Promise<LeaseResponse> {
    return new Promise((resolveResponse, rejectResponse) => {
      this.workerClient.LeaseNextTask(
        request,
        metadataFromTransport(metadata, this.mtlsPeerId),
        (error, response) => {
          if (error !== null) {
            rejectResponse(error);
            return;
          }
          resolveResponse(response);
        },
      );
    });
  }

  async renewLease(request: Lease, metadata: GrpcTransportMetadata = {}): Promise<Ack> {
    return new Promise((resolveResponse, rejectResponse) => {
      this.workerClient.RenewLease(
        request,
        metadataFromTransport(metadata, this.mtlsPeerId),
        (error, response) => {
          if (error !== null) {
            rejectResponse(error);
            return;
          }
          resolveResponse(response);
        },
      );
    });
  }

  async reportEvent(request: TaskEvent, metadata: GrpcTransportMetadata = {}): Promise<Ack> {
    return new Promise((resolveResponse, rejectResponse) => {
      this.workerClient.ReportEvent(
        request,
        metadataFromTransport(metadata, this.mtlsPeerId),
        (error, response) => {
          if (error !== null) {
            rejectResponse(error);
            return;
          }
          resolveResponse(response);
        },
      );
    });
  }

  async reportResult(request: TaskResult, metadata: GrpcTransportMetadata = {}): Promise<Ack> {
    return new Promise((resolveResponse, rejectResponse) => {
      this.workerClient.ReportResult(
        request,
        metadataFromTransport(metadata, this.mtlsPeerId),
        (error, response) => {
          if (error !== null) {
            rejectResponse(error);
            return;
          }
          resolveResponse(response);
        },
      );
    });
  }

  async registerArtifact(request: ArtifactRef, metadata: GrpcTransportMetadata = {}): Promise<Ack> {
    return new Promise((resolveResponse, rejectResponse) => {
      this.artifactClient.RegisterArtifact(
        request,
        metadataFromTransport(metadata, this.mtlsPeerId),
        (error, response) => {
          if (error !== null) {
            rejectResponse(error);
            return;
          }
          resolveResponse(response);
        },
      );
    });
  }

  async cancelWorkflow(request: PlanRun, metadata: GrpcTransportMetadata = {}): Promise<Ack> {
    return new Promise((resolveResponse, rejectResponse) => {
      this.adminClient.CancelWorkflow(
        request,
        metadataFromTransport(metadata, this.mtlsPeerId),
        (error, response) => {
          if (error !== null) {
            rejectResponse(error);
            return;
          }
          resolveResponse(response);
        },
      );
    });
  }

  close(): void {
    this.planClient.close();
    this.workerClient.close();
    this.artifactClient.close();
    this.adminClient.close();
  }
}
