import { createErrorEnvelope } from "../contracts/error-envelope";
import type { LeaseRepository } from "../persistence/lease-repository";
import type { TaskRepository } from "../persistence/task-repository";
import { PersistenceError } from "../persistence/types";
import type { WorkflowRepository } from "../persistence/workflow-repository";
import type { RuntimeConfig } from "../runtime/config";
import type { LeaseRequest, LeaseResponse } from "../runtime/grpc/orchestrator-v1";
import { isTimeoutExceeded, timeoutErrorMessage } from "./timeout-enforcer";

function taskStateToGrpc(
  state: string,
):
  | "TASK_STATE_QUEUED"
  | "TASK_STATE_LEASED"
  | "TASK_STATE_RUNNING"
  | "TASK_STATE_RETRY_WAIT"
  | "TASK_STATE_SUCCEEDED"
  | "TASK_STATE_FAILED"
  | "TASK_STATE_CANCELLED" {
  switch (state) {
    case "queued":
      return "TASK_STATE_QUEUED";
    case "leased":
      return "TASK_STATE_LEASED";
    case "running":
      return "TASK_STATE_RUNNING";
    case "retry_wait":
      return "TASK_STATE_RETRY_WAIT";
    case "succeeded":
      return "TASK_STATE_SUCCEEDED";
    case "failed":
      return "TASK_STATE_FAILED";
    case "cancelled":
      return "TASK_STATE_CANCELLED";
    default:
      return "TASK_STATE_QUEUED";
  }
}

export async function leaseNextTask(
  repositories: {
    taskRepository: TaskRepository;
    leaseRepository: LeaseRepository;
    workflowRepository: WorkflowRepository;
  },
  request: LeaseRequest,
  leaseTtlMs: number,
  config: RuntimeConfig,
  nowMs: number,
): Promise<LeaseResponse> {
  try {
    await repositories.taskRepository.requeueDueRetries(nowMs);

    const claimed = await repositories.taskRepository.claimNextQueuedTask({
      worker_id: request.worker_id,
      lease_ttl_ms: leaseTtlMs,
    });

    if (claimed === undefined) {
      return {};
    }

    const workflow = await repositories.workflowRepository.getWorkflow(claimed.task.workflow_id);
    if (
      workflow !== undefined &&
      isTimeoutExceeded({
        startedUnixMs: workflow.created_at,
        nowUnixMs: nowMs,
        timeoutSeconds: config.planStageTimeoutSeconds,
      })
    ) {
      await repositories.taskRepository.transitionTaskState({
        task_id: claimed.task.task_id,
        expected_from_state: "leased",
        to_state: "failed",
      });
      await repositories.workflowRepository.updateWorkflowState(claimed.task.workflow_id, "failed");

      return {
        error: createErrorEnvelope({
          code: "TASK_TIMEOUT",
          message: timeoutErrorMessage("plan", config.planStageTimeoutSeconds),
          requestId: request.request_id,
        }),
      };
    }

    if (
      isTimeoutExceeded({
        startedUnixMs: claimed.task.created_at,
        nowUnixMs: nowMs,
        timeoutSeconds: config.taskExecutionTimeoutSeconds,
      })
    ) {
      await repositories.taskRepository.transitionTaskState({
        task_id: claimed.task.task_id,
        expected_from_state: "leased",
        to_state: "failed",
      });

      return {
        error: createErrorEnvelope({
          code: "TASK_TIMEOUT",
          message: timeoutErrorMessage("task", config.taskExecutionTimeoutSeconds),
          requestId: request.request_id,
        }),
      };
    }

    return {
      lease: {
        request_id: request.request_id,
        task_id: claimed.lease.task_id,
        worker_id: claimed.lease.worker_id,
        expires_unix_ms: claimed.lease.expires_unix_ms,
      },
      task: {
        request_id: request.request_id,
        task_id: claimed.task.task_id,
        workflow_id: claimed.task.workflow_id,
        task_type: claimed.task.task_type,
        state: taskStateToGrpc(claimed.task.state),
        spec_json: claimed.task.spec_json,
      },
    };
  } catch (error) {
    if (error instanceof PersistenceError) {
      return {
        error: createErrorEnvelope({
          code: "LEASE_CONFLICT",
          message: error.message,
          requestId: request.request_id,
          retryable: true,
        }),
      };
    }

    return {
      error: createErrorEnvelope({
        code: "INTERNAL_ERROR",
        message: "Failed to lease next task.",
        requestId: request.request_id,
        retryable: false,
      }),
    };
  }
}
