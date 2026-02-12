import { type ErrorEnvelope, createErrorEnvelope } from "../../contracts/error-envelope";
import { currentContractVersion } from "../../contracts/version";
import type {
  ArtifactRef,
  Lease,
  LeaseRequest,
  PlanRun,
  TaskEvent,
  TaskResult,
} from "./orchestrator-v1";

export type GrpcTransportMetadata = {
  contractMajor?: number;
};

function requestIdOrFallback(requestId: string): string {
  if (requestId.trim().length === 0) {
    return "request-id-unavailable";
  }

  return requestId;
}

function isNonEmptyString(value: string): boolean {
  return value.trim().length > 0;
}

function invalidRequest(requestId: string, message: string): ErrorEnvelope {
  return createErrorEnvelope({
    code: "INVALID_REQUEST",
    message,
    requestId: requestIdOrFallback(requestId),
    retryable: false,
  });
}

function contractMismatch(requestId: string, message: string): ErrorEnvelope {
  return createErrorEnvelope({
    code: "CONTRACT_MISMATCH",
    message,
    requestId: requestIdOrFallback(requestId),
    retryable: false,
  });
}

export function validateContractMajor(
  metadata: GrpcTransportMetadata,
  requestId: string,
): ErrorEnvelope | undefined {
  if (metadata.contractMajor === undefined) {
    return undefined;
  }

  const expectedMajor = currentContractVersion().major;

  if (!Number.isInteger(metadata.contractMajor) || metadata.contractMajor <= 0) {
    return invalidRequest(
      requestId,
      "Invalid transport metadata: contractMajor must be a positive integer.",
    );
  }

  if (metadata.contractMajor !== expectedMajor) {
    return contractMismatch(
      requestId,
      `Contract major mismatch: expected ${expectedMajor}, received ${metadata.contractMajor}.`,
    );
  }

  return undefined;
}

export function validatePlanRunRequest(
  request: PlanRun,
  methodName: string,
): ErrorEnvelope | undefined {
  if (!isNonEmptyString(request.request_id)) {
    return invalidRequest(
      request.request_id,
      `Invalid ${methodName} request: request_id is required.`,
    );
  }

  if (!isNonEmptyString(request.workflow_id)) {
    return invalidRequest(
      request.request_id,
      `Invalid ${methodName} request: workflow_id is required.`,
    );
  }

  if (!isNonEmptyString(request.tenant_id)) {
    return invalidRequest(
      request.request_id,
      `Invalid ${methodName} request: tenant_id is required.`,
    );
  }

  if (!isNonEmptyString(request.intent)) {
    return invalidRequest(request.request_id, `Invalid ${methodName} request: intent is required.`);
  }

  return undefined;
}

export function validateLeaseRequest(
  request: LeaseRequest,
  methodName: string,
): ErrorEnvelope | undefined {
  if (!isNonEmptyString(request.request_id)) {
    return invalidRequest(
      request.request_id,
      `Invalid ${methodName} request: request_id is required.`,
    );
  }

  if (!isNonEmptyString(request.worker_id)) {
    return invalidRequest(
      request.request_id,
      `Invalid ${methodName} request: worker_id is required.`,
    );
  }

  return undefined;
}

export function validateLease(request: Lease, methodName: string): ErrorEnvelope | undefined {
  if (!isNonEmptyString(request.request_id)) {
    return invalidRequest(
      request.request_id,
      `Invalid ${methodName} request: request_id is required.`,
    );
  }

  if (!isNonEmptyString(request.task_id)) {
    return invalidRequest(
      request.request_id,
      `Invalid ${methodName} request: task_id is required.`,
    );
  }

  if (!isNonEmptyString(request.worker_id)) {
    return invalidRequest(
      request.request_id,
      `Invalid ${methodName} request: worker_id is required.`,
    );
  }

  if (!Number.isFinite(request.expires_unix_ms) || request.expires_unix_ms <= 0) {
    return invalidRequest(
      request.request_id,
      `Invalid ${methodName} request: expires_unix_ms must be a positive integer.`,
    );
  }

  return undefined;
}

export function validateTaskEvent(
  request: TaskEvent,
  methodName: string,
): ErrorEnvelope | undefined {
  if (!isNonEmptyString(request.request_id)) {
    return invalidRequest(
      request.request_id,
      `Invalid ${methodName} request: request_id is required.`,
    );
  }

  if (!isNonEmptyString(request.workflow_id)) {
    return invalidRequest(
      request.request_id,
      `Invalid ${methodName} request: workflow_id is required.`,
    );
  }

  if (!isNonEmptyString(request.task_id)) {
    return invalidRequest(
      request.request_id,
      `Invalid ${methodName} request: task_id is required.`,
    );
  }

  if (!isNonEmptyString(request.message)) {
    return invalidRequest(
      request.request_id,
      `Invalid ${methodName} request: message is required.`,
    );
  }

  if (!Number.isFinite(request.timestamp_unix_ms) || request.timestamp_unix_ms <= 0) {
    return invalidRequest(
      request.request_id,
      `Invalid ${methodName} request: timestamp_unix_ms must be a positive integer.`,
    );
  }

  return undefined;
}

export function validateTaskResult(
  request: TaskResult,
  methodName: string,
): ErrorEnvelope | undefined {
  if (!isNonEmptyString(request.request_id)) {
    return invalidRequest(
      request.request_id,
      `Invalid ${methodName} request: request_id is required.`,
    );
  }

  if (!isNonEmptyString(request.workflow_id)) {
    return invalidRequest(
      request.request_id,
      `Invalid ${methodName} request: workflow_id is required.`,
    );
  }

  if (!isNonEmptyString(request.task_id)) {
    return invalidRequest(
      request.request_id,
      `Invalid ${methodName} request: task_id is required.`,
    );
  }

  return undefined;
}

export function validateArtifactRef(
  request: ArtifactRef,
  methodName: string,
): ErrorEnvelope | undefined {
  if (!isNonEmptyString(request.request_id)) {
    return invalidRequest(
      request.request_id,
      `Invalid ${methodName} request: request_id is required.`,
    );
  }

  if (!isNonEmptyString(request.workflow_id)) {
    return invalidRequest(
      request.request_id,
      `Invalid ${methodName} request: workflow_id is required.`,
    );
  }

  if (!isNonEmptyString(request.task_id)) {
    return invalidRequest(
      request.request_id,
      `Invalid ${methodName} request: task_id is required.`,
    );
  }

  if (!isNonEmptyString(request.uri)) {
    return invalidRequest(request.request_id, `Invalid ${methodName} request: uri is required.`);
  }

  if (!isNonEmptyString(request.digest)) {
    return invalidRequest(request.request_id, `Invalid ${methodName} request: digest is required.`);
  }

  return undefined;
}
