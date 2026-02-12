import { createErrorEnvelope } from "../contracts/error-envelope";
import type { TaskRepository } from "../persistence/task-repository";
import { PersistenceError } from "../persistence/types";
import type { WorkflowRepository } from "../persistence/workflow-repository";
import type { Ack, PlanRun } from "../runtime/grpc/orchestrator-v1";

function cancellationFailure(requestId: string, message: string): Ack {
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

export async function cancelWorkflow(
  repositories: {
    workflowRepository: WorkflowRepository;
    taskRepository: TaskRepository;
  },
  request: PlanRun,
): Promise<Ack> {
  try {
    const workflow = await repositories.workflowRepository.getWorkflow(request.workflow_id);
    if (workflow === undefined) {
      return {
        ok: false,
        error: createErrorEnvelope({
          code: "POLICY_DENIED",
          message: `Workflow ${request.workflow_id} does not exist.`,
          requestId: request.request_id,
          retryable: false,
        }),
      };
    }

    const tasks = await repositories.taskRepository.listTasksByWorkflow(request.workflow_id);
    for (const task of tasks) {
      if (task.state === "succeeded" || task.state === "failed" || task.state === "cancelled") {
        continue;
      }

      await repositories.taskRepository.transitionTaskState({
        task_id: task.task_id,
        expected_from_state: task.state,
        to_state: "cancelled",
      });
    }

    if (workflow.state !== "cancelled") {
      await repositories.workflowRepository.updateWorkflowState(request.workflow_id, "cancelled");
    }

    return { ok: true };
  } catch (error) {
    if (error instanceof PersistenceError) {
      return cancellationFailure(request.request_id, error.message);
    }

    return cancellationFailure(request.request_id, "Failed to cancel workflow deterministically.");
  }
}
