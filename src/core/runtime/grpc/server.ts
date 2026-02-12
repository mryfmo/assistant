import { createErrorEnvelope } from "../../contracts/error-envelope";
import {
  type RuntimeOrchestrator,
  createOrchestratorServiceHandlers,
  createRuntimeOrchestrator,
} from "../../orchestrator";
import { type RuntimeConfig, loadRuntimeConfig } from "../config";
import { type RuntimeLogger, createRuntimeLogger } from "../logging/logger";
import { withRuntimeRequestContext } from "./interceptors";
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
import {
  type AdminServiceHandlers,
  type ArtifactServiceHandlers,
  type GrpcServiceHandlers,
  type PlanServiceHandlers,
  type WorkerServiceHandlers,
  createDefaultGrpcServiceHandlers,
} from "./services";
import {
  type GrpcTransportMetadata,
  validateArtifactRef,
  validateContractMajor,
  validateLease,
  validateLeaseRequest,
  validatePlanRunRequest,
  validateTaskEvent,
  validateTaskResult,
} from "./validation";

export type RuntimeGrpcServiceHandlerOverrides = {
  plan?: Partial<PlanServiceHandlers>;
  worker?: Partial<WorkerServiceHandlers>;
  artifact?: Partial<ArtifactServiceHandlers>;
  admin?: Partial<AdminServiceHandlers>;
};

function requestIdOrFallback(requestId: string | undefined): string {
  if (requestId === undefined || requestId.trim().length === 0) {
    return "request-id-unavailable";
  }

  return requestId;
}

function parseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown runtime gRPC service error.";
}

function mergeHandlers(
  overrides: RuntimeGrpcServiceHandlerOverrides | undefined,
): GrpcServiceHandlers {
  const defaults = createDefaultGrpcServiceHandlers();

  return {
    plan: {
      ...defaults.plan,
      ...overrides?.plan,
    },
    worker: {
      ...defaults.worker,
      ...overrides?.worker,
    },
    artifact: {
      ...defaults.artifact,
      ...overrides?.artifact,
    },
    admin: {
      ...defaults.admin,
      ...overrides?.admin,
    },
  };
}

export class RuntimeGrpcServiceServer {
  private started = false;
  private readonly handlers: GrpcServiceHandlers;
  private readonly submitPlanHandler: (request: PlanRun) => Promise<Ack>;
  private readonly leaseNextTaskHandler: (request: LeaseRequest) => Promise<LeaseResponse>;
  private readonly renewLeaseHandler: (request: Lease) => Promise<Ack>;
  private readonly reportEventHandler: (request: TaskEvent) => Promise<Ack>;
  private readonly reportResultHandler: (request: TaskResult) => Promise<Ack>;
  private readonly registerArtifactHandler: (request: ArtifactRef) => Promise<Ack>;
  private readonly cancelWorkflowHandler: (request: PlanRun) => Promise<Ack>;

  constructor(
    options: { handlers?: RuntimeGrpcServiceHandlerOverrides; logger?: RuntimeLogger } = {},
  ) {
    this.handlers = mergeHandlers(options.handlers);
    const logger = options.logger ?? createRuntimeLogger();

    this.submitPlanHandler = withRuntimeRequestContext({
      eventType: "grpc.plan.submit_plan",
      extractMetadata: (request) => ({
        request_id: request.request_id,
        workflow_id: request.workflow_id,
      }),
      handler: (request) => this.handlers.plan.submitPlan(request),
      logger,
    });

    this.leaseNextTaskHandler = withRuntimeRequestContext({
      eventType: "grpc.worker.lease_next_task",
      extractMetadata: (request) => ({
        request_id: request.request_id,
        worker_id: request.worker_id,
      }),
      handler: (request) => this.handlers.worker.leaseNextTask(request),
      logger,
    });

    this.renewLeaseHandler = withRuntimeRequestContext({
      eventType: "grpc.worker.renew_lease",
      extractMetadata: (request) => ({
        request_id: request.request_id,
        task_id: request.task_id,
        worker_id: request.worker_id,
      }),
      handler: (request) => this.handlers.worker.renewLease(request),
      logger,
    });

    this.reportEventHandler = withRuntimeRequestContext({
      eventType: "grpc.worker.report_event",
      extractMetadata: (request) => ({
        request_id: request.request_id,
        workflow_id: request.workflow_id,
        task_id: request.task_id,
      }),
      handler: (request) => this.handlers.worker.reportEvent(request),
      logger,
    });

    this.reportResultHandler = withRuntimeRequestContext({
      eventType: "grpc.worker.report_result",
      extractMetadata: (request) => ({
        request_id: request.request_id,
        workflow_id: request.workflow_id,
        task_id: request.task_id,
      }),
      handler: (request) => this.handlers.worker.reportResult(request),
      logger,
    });

    this.registerArtifactHandler = withRuntimeRequestContext({
      eventType: "grpc.artifact.register_artifact",
      extractMetadata: (request) => ({
        request_id: request.request_id,
        workflow_id: request.workflow_id,
        task_id: request.task_id,
      }),
      handler: (request) => this.handlers.artifact.registerArtifact(request),
      logger,
    });

    this.cancelWorkflowHandler = withRuntimeRequestContext({
      eventType: "grpc.admin.cancel_workflow",
      extractMetadata: (request) => ({
        request_id: request.request_id,
        workflow_id: request.workflow_id,
      }),
      handler: (request) => this.handlers.admin.cancelWorkflow(request),
      logger,
    });
  }

  async start(): Promise<void> {
    this.started = true;
  }

  async stop(): Promise<void> {
    this.started = false;
  }

  isStarted(): boolean {
    return this.started;
  }

  private serviceNotStartedError(requestId: string | undefined) {
    return createErrorEnvelope({
      code: "INTERNAL_ERROR",
      message: "Runtime gRPC service server has not been started.",
      requestId: requestIdOrFallback(requestId),
      retryable: false,
    });
  }

  private ackFromError(error: ReturnType<typeof createErrorEnvelope>): Ack {
    return {
      ok: false,
      error,
    };
  }

  private leaseResponseFromError(error: ReturnType<typeof createErrorEnvelope>): LeaseResponse {
    return {
      error,
    };
  }

  private buildAckFailure(requestId: string | undefined, message: string): Ack {
    return {
      ok: false,
      error: createErrorEnvelope({
        code: "INTERNAL_ERROR",
        message,
        requestId: requestIdOrFallback(requestId),
        retryable: false,
      }),
    };
  }

  private buildLeaseFailure(requestId: string | undefined, message: string): LeaseResponse {
    return {
      error: createErrorEnvelope({
        code: "INTERNAL_ERROR",
        message,
        requestId: requestIdOrFallback(requestId),
        retryable: false,
      }),
    };
  }

  async submitPlan(request: PlanRun, metadata: GrpcTransportMetadata = {}): Promise<Ack> {
    if (!this.started) {
      return this.ackFromError(this.serviceNotStartedError(request.request_id));
    }

    const contractVersionError = validateContractMajor(metadata, request.request_id);
    if (contractVersionError !== undefined) {
      return this.ackFromError(contractVersionError);
    }

    const requestValidationError = validatePlanRunRequest(request, "PlanService.SubmitPlan");
    if (requestValidationError !== undefined) {
      return this.ackFromError(requestValidationError);
    }

    try {
      return await this.submitPlanHandler(request);
    } catch (error) {
      return this.buildAckFailure(request.request_id, parseErrorMessage(error));
    }
  }

  async leaseNextTask(
    request: LeaseRequest,
    metadata: GrpcTransportMetadata = {},
  ): Promise<LeaseResponse> {
    if (!this.started) {
      return this.leaseResponseFromError(this.serviceNotStartedError(request.request_id));
    }

    const contractVersionError = validateContractMajor(metadata, request.request_id);
    if (contractVersionError !== undefined) {
      return this.leaseResponseFromError(contractVersionError);
    }

    const requestValidationError = validateLeaseRequest(request, "WorkerService.LeaseNextTask");
    if (requestValidationError !== undefined) {
      return this.leaseResponseFromError(requestValidationError);
    }

    try {
      return await this.leaseNextTaskHandler(request);
    } catch (error) {
      return this.buildLeaseFailure(request.request_id, parseErrorMessage(error));
    }
  }

  async renewLease(request: Lease, metadata: GrpcTransportMetadata = {}): Promise<Ack> {
    if (!this.started) {
      return this.ackFromError(this.serviceNotStartedError(request.request_id));
    }

    const contractVersionError = validateContractMajor(metadata, request.request_id);
    if (contractVersionError !== undefined) {
      return this.ackFromError(contractVersionError);
    }

    const requestValidationError = validateLease(request, "WorkerService.RenewLease");
    if (requestValidationError !== undefined) {
      return this.ackFromError(requestValidationError);
    }

    try {
      return await this.renewLeaseHandler(request);
    } catch (error) {
      return this.buildAckFailure(request.request_id, parseErrorMessage(error));
    }
  }

  async reportEvent(request: TaskEvent, metadata: GrpcTransportMetadata = {}): Promise<Ack> {
    if (!this.started) {
      return this.ackFromError(this.serviceNotStartedError(request.request_id));
    }

    const contractVersionError = validateContractMajor(metadata, request.request_id);
    if (contractVersionError !== undefined) {
      return this.ackFromError(contractVersionError);
    }

    const requestValidationError = validateTaskEvent(request, "WorkerService.ReportEvent");
    if (requestValidationError !== undefined) {
      return this.ackFromError(requestValidationError);
    }

    try {
      return await this.reportEventHandler(request);
    } catch (error) {
      return this.buildAckFailure(request.request_id, parseErrorMessage(error));
    }
  }

  async reportResult(request: TaskResult, metadata: GrpcTransportMetadata = {}): Promise<Ack> {
    if (!this.started) {
      return this.ackFromError(this.serviceNotStartedError(request.request_id));
    }

    const contractVersionError = validateContractMajor(metadata, request.request_id);
    if (contractVersionError !== undefined) {
      return this.ackFromError(contractVersionError);
    }

    const requestValidationError = validateTaskResult(request, "WorkerService.ReportResult");
    if (requestValidationError !== undefined) {
      return this.ackFromError(requestValidationError);
    }

    try {
      return await this.reportResultHandler(request);
    } catch (error) {
      return this.buildAckFailure(request.request_id, parseErrorMessage(error));
    }
  }

  async registerArtifact(request: ArtifactRef, metadata: GrpcTransportMetadata = {}): Promise<Ack> {
    if (!this.started) {
      return this.ackFromError(this.serviceNotStartedError(request.request_id));
    }

    const contractVersionError = validateContractMajor(metadata, request.request_id);
    if (contractVersionError !== undefined) {
      return this.ackFromError(contractVersionError);
    }

    const requestValidationError = validateArtifactRef(request, "ArtifactService.RegisterArtifact");
    if (requestValidationError !== undefined) {
      return this.ackFromError(requestValidationError);
    }

    try {
      return await this.registerArtifactHandler(request);
    } catch (error) {
      return this.buildAckFailure(request.request_id, parseErrorMessage(error));
    }
  }

  async cancelWorkflow(request: PlanRun, metadata: GrpcTransportMetadata = {}): Promise<Ack> {
    if (!this.started) {
      return this.ackFromError(this.serviceNotStartedError(request.request_id));
    }

    const contractVersionError = validateContractMajor(metadata, request.request_id);
    if (contractVersionError !== undefined) {
      return this.ackFromError(contractVersionError);
    }

    const requestValidationError = validatePlanRunRequest(request, "AdminService.CancelWorkflow");
    if (requestValidationError !== undefined) {
      return this.ackFromError(requestValidationError);
    }

    try {
      return await this.cancelWorkflowHandler(request);
    } catch (error) {
      return this.buildAckFailure(request.request_id, parseErrorMessage(error));
    }
  }
}

export function createRuntimeGrpcServerWithLocalOrchestrator(
  options: {
    config?: RuntimeConfig;
    logger?: RuntimeLogger;
    orchestrator?: RuntimeOrchestrator;
  } = {},
): {
  server: RuntimeGrpcServiceServer;
  orchestrator: RuntimeOrchestrator;
  config: RuntimeConfig;
} {
  const config = options.config ?? loadRuntimeConfig({});
  const orchestrator = options.orchestrator ?? createRuntimeOrchestrator();
  const server = new RuntimeGrpcServiceServer({
    handlers: createOrchestratorServiceHandlers(orchestrator, config),
    logger: options.logger,
  });

  return {
    server,
    orchestrator,
    config,
  };
}
