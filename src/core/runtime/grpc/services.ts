import { createErrorEnvelope } from "../../contracts/error-envelope";
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

export type MaybePromise<T> = T | Promise<T>;

export type PlanServiceHandlers = {
  submitPlan: (request: PlanRun) => MaybePromise<Ack>;
};

export type WorkerServiceHandlers = {
  leaseNextTask: (request: LeaseRequest) => MaybePromise<LeaseResponse>;
  renewLease: (request: Lease) => MaybePromise<Ack>;
  reportEvent: (request: TaskEvent) => MaybePromise<Ack>;
  reportResult: (request: TaskResult) => MaybePromise<Ack>;
};

export type ArtifactServiceHandlers = {
  registerArtifact: (request: ArtifactRef) => MaybePromise<Ack>;
};

export type AdminServiceHandlers = {
  cancelWorkflow: (request: PlanRun) => MaybePromise<Ack>;
};

export type GrpcServiceHandlers = {
  plan: PlanServiceHandlers;
  worker: WorkerServiceHandlers;
  artifact: ArtifactServiceHandlers;
  admin: AdminServiceHandlers;
};

function notImplementedAck(requestId: string, methodName: string): Ack {
  return {
    ok: false,
    error: createErrorEnvelope({
      code: "INTERNAL_ERROR",
      message: `${methodName} is not implemented yet in runtime service skeleton.`,
      requestId,
      retryable: false,
    }),
  };
}

export function createDefaultGrpcServiceHandlers(): GrpcServiceHandlers {
  return {
    plan: {
      submitPlan: (request) => notImplementedAck(request.request_id, "PlanService.SubmitPlan"),
    },
    worker: {
      leaseNextTask: (request) => ({
        error: createErrorEnvelope({
          code: "INTERNAL_ERROR",
          message:
            "WorkerService.LeaseNextTask is not implemented yet in runtime service skeleton.",
          requestId: request.request_id,
          retryable: false,
        }),
      }),
      renewLease: (request) => notImplementedAck(request.request_id, "WorkerService.RenewLease"),
      reportEvent: (request) => notImplementedAck(request.request_id, "WorkerService.ReportEvent"),
      reportResult: (request) =>
        notImplementedAck(request.request_id, "WorkerService.ReportResult"),
    },
    artifact: {
      registerArtifact: (request) =>
        notImplementedAck(request.request_id, "ArtifactService.RegisterArtifact"),
    },
    admin: {
      cancelWorkflow: (request) =>
        notImplementedAck(request.request_id, "AdminService.CancelWorkflow"),
    },
  };
}
