export type CorrelationContext = {
  workflowId: string;
  taskId: string;
  requestId: string;
  workerId?: string;
};

export type CorrelationLogFields = {
  workflow_id: string;
  task_id: string;
  request_id: string;
  worker_id?: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidCorrelationContext(value: unknown): value is CorrelationContext {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as {
    workflowId?: unknown;
    taskId?: unknown;
    requestId?: unknown;
    workerId?: unknown;
  };

  const hasRequiredFields =
    isNonEmptyString(candidate.workflowId) &&
    isNonEmptyString(candidate.taskId) &&
    isNonEmptyString(candidate.requestId);

  if (!hasRequiredFields) {
    return false;
  }

  return candidate.workerId === undefined || isNonEmptyString(candidate.workerId);
}

export function assertCorrelationContext(value: unknown): asserts value is CorrelationContext {
  if (!isValidCorrelationContext(value)) {
    throw new Error(
      "Invalid correlation context: workflowId, taskId, and requestId are required non-empty strings.",
    );
  }
}

export function toCorrelationLogFields(context: CorrelationContext): CorrelationLogFields {
  return {
    workflow_id: context.workflowId,
    task_id: context.taskId,
    request_id: context.requestId,
    worker_id: context.workerId,
  };
}
