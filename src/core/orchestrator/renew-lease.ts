import { createErrorEnvelope } from "../contracts/error-envelope";
import type { LeaseRepository } from "../persistence/lease-repository";
import type { TaskRepository } from "../persistence/task-repository";
import { PersistenceError } from "../persistence/types";
import type { Ack, Lease } from "../runtime/grpc/orchestrator-v1";

export async function renewLease(
  repositories: {
    leaseRepository: LeaseRepository;
    taskRepository: TaskRepository;
  },
  request: Lease,
  leaseTtlMs: number,
  nowMs: number,
): Promise<Ack> {
  const existing = await repositories.leaseRepository.getLease(request.task_id);
  if (existing === undefined) {
    return {
      ok: false,
      error: createErrorEnvelope({
        code: "LEASE_CONFLICT",
        message: `Task ${request.task_id} has no active lease to renew.`,
        requestId: request.request_id,
      }),
    };
  }

  if (existing.worker_id !== request.worker_id) {
    return {
      ok: false,
      error: createErrorEnvelope({
        code: "LEASE_CONFLICT",
        message: `Lease for task ${request.task_id} belongs to ${existing.worker_id}.`,
        requestId: request.request_id,
      }),
    };
  }

  if (existing.expires_unix_ms <= nowMs) {
    return {
      ok: false,
      error: createErrorEnvelope({
        code: "TASK_TIMEOUT",
        message: `Lease for task ${request.task_id} has already expired.`,
        requestId: request.request_id,
      }),
    };
  }

  try {
    await repositories.leaseRepository.renewLease({
      task_id: request.task_id,
      worker_id: request.worker_id,
      lease_ttl_ms: leaseTtlMs,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof PersistenceError) {
      return {
        ok: false,
        error: createErrorEnvelope({
          code: "LEASE_CONFLICT",
          message: error.message,
          requestId: request.request_id,
        }),
      };
    }

    return {
      ok: false,
      error: createErrorEnvelope({
        code: "INTERNAL_ERROR",
        message: "Failed to renew task lease.",
        requestId: request.request_id,
        retryable: false,
      }),
    };
  }
}
