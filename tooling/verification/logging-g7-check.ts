import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildRuntimeLogEventRecord,
  createAuditEvent,
  isValidCorrelationContext,
} from "../../src/core/runtime/index";

function assertCondition(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

type ParsedLogEventSchema = {
  required?: unknown;
  properties?: unknown;
  dependentRequired?: unknown;
};

function loadLogEventSchema(repoRoot: string): ParsedLogEventSchema {
  const schemaPath = resolve(repoRoot, "contracts/jsonschema/log-event.v1.json");
  const raw = readFileSync(schemaPath, "utf-8");
  const parsed: unknown = JSON.parse(raw);

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("log-event schema is malformed.");
  }

  return parsed as ParsedLogEventSchema;
}

function validateSchemaRequiredFields(schema: ParsedLogEventSchema): void {
  const requiredFieldList = schema.required;
  if (
    !Array.isArray(requiredFieldList) ||
    requiredFieldList.some((entry) => typeof entry !== "string")
  ) {
    throw new Error("log-event schema required list must be string[].");
  }
  const expected = [
    "timestamp",
    "level",
    "event_type",
    "message",
    "workflow_id",
    "task_id",
    "request_id",
  ];

  for (const field of expected) {
    assertCondition(
      requiredFieldList.includes(field),
      `log-event schema missing required field: ${field}`,
    );
  }
}

function validateSchemaTraceFields(schema: ParsedLogEventSchema): void {
  const properties = schema.properties;
  assertCondition(
    typeof properties === "object" && properties !== null,
    "log-event schema properties are required",
  );

  const propertyRecord = properties as Record<string, unknown>;
  assertCondition("trace_id" in propertyRecord, "log-event schema must define trace_id");
  assertCondition("span_id" in propertyRecord, "log-event schema must define span_id");

  const dependentRequired = schema.dependentRequired;
  assertCondition(
    typeof dependentRequired === "object" && dependentRequired !== null,
    "log-event schema must define dependentRequired for trace linkage",
  );

  const dependencyRecord = dependentRequired as Record<string, unknown>;
  const traceDepends = dependencyRecord.trace_id;
  const spanDepends = dependencyRecord.span_id;

  assertCondition(
    Array.isArray(traceDepends) && traceDepends.includes("span_id"),
    "trace_id must require span_id",
  );
  assertCondition(
    Array.isArray(spanDepends) && spanDepends.includes("trace_id"),
    "span_id must require trace_id",
  );
}

function validateRuntimeRecordBehavior(): void {
  const context = {
    workflowId: "wf-123",
    taskId: "task-456",
    requestId: "req-789",
    workerId: "worker-abc",
  };

  assertCondition(isValidCorrelationContext(context), "Expected valid correlation context.");

  const record = buildRuntimeLogEventRecord({
    level: "info",
    eventType: "task_completed",
    message: "Task execution finished.",
    context,
    data: {
      safeField: "ok",
      password: "should-not-appear",
      nested: {
        authorization: "Bearer x",
        apiKey: "key-123",
      },
    },
  });

  assertCondition(record.workflow_id === context.workflowId, "workflow_id mismatch");
  assertCondition(record.task_id === context.taskId, "task_id mismatch");
  assertCondition(record.request_id === context.requestId, "request_id mismatch");

  const data = record.data as {
    password?: unknown;
    nested?: { authorization?: unknown; apiKey?: unknown };
  };
  assertCondition(data.password === "[REDACTED]", "password must be redacted");
  assertCondition(data.nested?.authorization === "[REDACTED]", "authorization must be redacted");
  assertCondition(data.nested?.apiKey === "[REDACTED]", "apiKey must be redacted");

  const auditEvent = createAuditEvent({
    action: "task_completed",
    actorType: "agent",
    actorId: "execution-agent-1",
    context,
    payload: {
      token: "secret-token",
    },
  });

  assertCondition(
    auditEvent.request_id === context.requestId,
    "audit event must include request_id",
  );
  assertCondition(
    typeof auditEvent.digest === "string" && auditEvent.digest.length > 0,
    "audit digest is required",
  );
  const payload = auditEvent.payload as { token?: unknown };
  assertCondition(payload.token === "[REDACTED]", "audit payload must redact token");

  const tracedRecord = buildRuntimeLogEventRecord({
    level: "debug",
    eventType: "trace_linked_event",
    message: "Trace-linked event.",
    context,
    traceId: "1234567890abcdef1234567890abcdef",
    spanId: "1234567890abcdef",
    data: {
      status: "ok",
    },
  });

  assertCondition(
    tracedRecord.trace_id === "1234567890abcdef1234567890abcdef",
    "trace_id should propagate to runtime log event",
  );
  assertCondition(
    tracedRecord.span_id === "1234567890abcdef",
    "span_id should propagate to runtime log event",
  );

  let rejectedPartialTraceContext = false;
  try {
    buildRuntimeLogEventRecord({
      level: "info",
      eventType: "invalid_partial_trace",
      message: "This should fail.",
      context,
      traceId: "1234567890abcdef1234567890abcdef",
    });
  } catch (_error) {
    rejectedPartialTraceContext = true;
  }

  assertCondition(rejectedPartialTraceContext, "partial trace context must be rejected");
}

function main(): void {
  const repoRoot = resolve(__dirname, "../..");
  const schema = loadLogEventSchema(repoRoot);

  validateSchemaRequiredFields(schema);
  validateSchemaTraceFields(schema);
  validateRuntimeRecordBehavior();

  process.stdout.write("G7 logging validation passed.\n");
}

main();
