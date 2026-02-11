import { type CorrelationContext, assertCorrelationContext } from "./context";
import { redactLogPayload } from "./redaction";

export type AuditAction =
  | "plan_created"
  | "task_dispatched"
  | "task_completed"
  | "task_failed"
  | "promotion_approved"
  | "promotion_denied";

export type AuditEventInput = {
  timestamp?: string;
  action: AuditAction;
  actorType: "user" | "agent" | "system";
  actorId: string;
  context: CorrelationContext;
  payload?: unknown;
};

export type AuditEvent = {
  timestamp: string;
  action: AuditAction;
  actor_type: "user" | "agent" | "system";
  actor_id: string;
  workflow_id: string;
  task_id: string;
  request_id: string;
  worker_id?: string;
  payload?: unknown;
  digest: string;
};

function stableNormalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stableNormalize(entry));
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  const normalizedObject = Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nested]) => [key, stableNormalize(nested)] as const);

  return Object.fromEntries(normalizedObject);
}

function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createAuditEvent(input: AuditEventInput): AuditEvent {
  assertCorrelationContext(input.context);

  const timestamp = input.timestamp ?? new Date().toISOString();
  const payload = redactLogPayload(input.payload);

  const eventCore = {
    timestamp,
    action: input.action,
    actor_type: input.actorType,
    actor_id: input.actorId,
    workflow_id: input.context.workflowId,
    task_id: input.context.taskId,
    request_id: input.context.requestId,
    worker_id: input.context.workerId,
    payload,
  };

  const digest = fnv1aHex(JSON.stringify(stableNormalize(eventCore)));

  return {
    ...eventCore,
    digest,
  };
}
