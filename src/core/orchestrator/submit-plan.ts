import { createErrorEnvelope } from "../contracts/error-envelope";
import type { TaskRepository } from "../persistence/task-repository";
import { PersistenceError } from "../persistence/types";
import type { WorkflowRepository } from "../persistence/workflow-repository";
import type { Ack } from "../runtime/grpc/orchestrator-v1";

export type SubmitPlanInput = {
  request_id: string;
  workflow_id: string;
  tenant_id: string;
  intent: string;
};

function submitPlanError(requestId: string, message: string): Ack {
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

export async function submitPlan(
  repositories: {
    workflowRepository: WorkflowRepository;
    taskRepository: TaskRepository;
  },
  input: SubmitPlanInput,
): Promise<Ack> {
  try {
    await repositories.workflowRepository.createWorkflow({
      workflow_id: input.workflow_id,
      tenant_id: input.tenant_id,
    });

    await repositories.taskRepository.createTask({
      task_id: `${input.workflow_id}:task:0001`,
      workflow_id: input.workflow_id,
      task_type: "plan.execute",
      spec_json: new TextEncoder().encode(JSON.stringify({ intent: input.intent })),
      priority: 100,
      idempotency_key: `${input.request_id}:task:0001`,
    });

    return { ok: true };
  } catch (error) {
    if (error instanceof PersistenceError) {
      if (error.code === "WORKFLOW_ALREADY_EXISTS") {
        return {
          ok: false,
          error: createErrorEnvelope({
            code: "POLICY_DENIED",
            message: error.message,
            requestId: input.request_id,
            retryable: false,
          }),
        };
      }

      return submitPlanError(input.request_id, error.message);
    }

    return submitPlanError(input.request_id, "Failed to persist SubmitPlan workflow/tasks.");
  }
}
