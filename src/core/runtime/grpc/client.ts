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
