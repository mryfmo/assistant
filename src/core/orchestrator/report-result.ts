import { createErrorEnvelope } from "../contracts/error-envelope";
import type { TaskRepository } from "../persistence/task-repository";
import { PersistenceError } from "../persistence/types";
import type { WorkflowRepository } from "../persistence/workflow-repository";
import type { RuntimeConfig } from "../runtime/config";
import type { Ack, TaskResult } from "../runtime/grpc/orchestrator-v1";
import { evaluateRetryDecision, retryBackoffMs } from "./retry-policy";

function reportResultFailure(requestId: string, message: string): Ack {
  return {
    ok: false,
    error: createErrorEnvelope({
      code: "INTERNAL_ERROR",
      message,
      requestId,
      retryable: false,
    }),
  };
}

export async function reportResult(
  repositories: {
    taskRepository: TaskRepository;
    workflowRepository: WorkflowRepository;
  },
  request: TaskResult,
  config: RuntimeConfig,
): Promise<Ack> {
  try {
    const existing = await repositories.taskRepository.getTask(request.task_id);
    if (existing?.state === "leased") {
      await repositories.taskRepository.markTaskRunning(request.task_id);
    }

    const retryDecision = evaluateRetryDecision({
      success: request.success,
      errorCode: request.error?.code,
      retryCount: existing?.retry_count ?? 0,
      maxRetry: config.maxRetry,
    });

    const updatedTask = await repositories.taskRepository.completeTaskFromResult({
      task_id: request.task_id,
      workflow_id: request.workflow_id,
      success: request.success,
      retryable: retryDecision.shouldRetry,
    });

    if (updatedTask.state === "retry_wait") {
      await repositories.taskRepository.scheduleRetry(
        updatedTask.task_id,
        retryBackoffMs(updatedTask.retry_count),
      );
      return { ok: true };
    }

    const remaining = await repositories.taskRepository.countNonTerminalTasks(request.workflow_id);
    if (remaining === 0) {
      await repositories.workflowRepository.updateWorkflowState(request.workflow_id, "succeeded");
    }

    return { ok: true };
  } catch (error) {
    if (error instanceof PersistenceError) {
      if (error.code === "WORKFLOW_ID_IMMUTABLE") {
        return {
          ok: false,
          error: createErrorEnvelope({
            code: "POLICY_DENIED",
            message: error.message,
            requestId: request.request_id,
            retryable: false,
          }),
        };
      }

      return reportResultFailure(request.request_id, error.message);
    }

    return reportResultFailure(request.request_id, "Failed to persist ReportResult outcome.");
  }
}
