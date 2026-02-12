import type { ClarificationGate } from "../clarification/clarification-gate";
import { createErrorEnvelope } from "../contracts/error-envelope";
import type { TaskRepository } from "../persistence/task-repository";
import { PersistenceError } from "../persistence/types";
import type { WorkflowRepository } from "../persistence/workflow-repository";
import { stablePlanGraphJson } from "../planning/dag-determinism";
import { buildDeterministicPlanGraph } from "../planning/plan-agent";
import type { RuntimeConfig } from "../runtime/config";
import type { Ack } from "../runtime/grpc/orchestrator-v1";
import {
  enforceLoadShedding,
  enforcePayloadLimit,
  enforceTenantWorkflowLimit,
} from "./runtime-limits";

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
    clarificationGate?: ClarificationGate;
  },
  input: SubmitPlanInput,
  config: RuntimeConfig,
): Promise<Ack> {
  const clarification = repositories.clarificationGate?.evaluateIntent({
    workflow_id: input.workflow_id,
    intent: input.intent,
  });
  if (clarification?.status === "blocked") {
    return {
      ok: false,
      error: createErrorEnvelope({
        code: "POLICY_DENIED",
        message: `Clarification required before execution: ${clarification.question.prompt}`,
        requestId: input.request_id,
        retryable: false,
      }),
    };
  }

  const planGraph = buildDeterministicPlanGraph({
    workflow_id: input.workflow_id,
    intent: input.intent,
    ambiguous: false,
    high_risk: false,
  });

  const payloadBytes = new TextEncoder().encode(input.intent).byteLength;
  const payloadLimit = enforcePayloadLimit({
    payloadBytes,
    maxPayloadBytes: config.maxTaskPayloadBytes,
  });
  if (!payloadLimit.ok) {
    return {
      ok: false,
      error: createErrorEnvelope({
        code: payloadLimit.code,
        message: payloadLimit.message,
        requestId: input.request_id,
        retryable: false,
      }),
    };
  }

  const activeWorkflowCount = await repositories.workflowRepository.countActiveWorkflowsByTenant(
    input.tenant_id,
  );
  const tenantLimit = enforceTenantWorkflowLimit({
    activeWorkflowCount,
    maxActiveWorkflows: config.maxActiveWorkflowsPerTenant,
  });
  if (!tenantLimit.ok) {
    return {
      ok: false,
      error: createErrorEnvelope({
        code: tenantLimit.code,
        message: tenantLimit.message,
        requestId: input.request_id,
        retryable: false,
      }),
    };
  }

  const queuedTaskCount = await repositories.taskRepository.countQueuedTasks();
  const loadShedding = enforceLoadShedding({
    queuedTaskCount,
    maxActiveWorkflowsPerTenant: config.maxActiveWorkflowsPerTenant,
  });
  if (!loadShedding.ok) {
    return {
      ok: false,
      error: createErrorEnvelope({
        code: loadShedding.code,
        message: loadShedding.message,
        requestId: input.request_id,
        retryable: false,
      }),
    };
  }

  try {
    await repositories.workflowRepository.createWorkflow({
      workflow_id: input.workflow_id,
      tenant_id: input.tenant_id,
    });

    await repositories.taskRepository.createTask({
      task_id: `${input.workflow_id}:task:0001`,
      workflow_id: input.workflow_id,
      task_type: "plan.execute",
      spec_json: new TextEncoder().encode(
        JSON.stringify({
          intent: input.intent,
          plan_graph_json: stablePlanGraphJson(planGraph),
        }),
      ),
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
