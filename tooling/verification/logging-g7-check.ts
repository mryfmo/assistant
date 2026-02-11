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

function loadLogEventSchemaRequiredFields(repoRoot: string): string[] {
  const schemaPath = resolve(repoRoot, "contracts/jsonschema/log-event.v1.json");
  const raw = readFileSync(schemaPath, "utf-8");
  const parsed: unknown = JSON.parse(raw);

  if (typeof parsed !== "object" || parsed === null || !("required" in parsed)) {
    throw new Error("log-event schema is missing required field definitions.");
  }

  const requiredFieldList = (parsed as { required?: unknown }).required;
  if (
    !Array.isArray(requiredFieldList) ||
    requiredFieldList.some((entry) => typeof entry !== "string")
  ) {
    throw new Error("log-event schema required list must be string[].");
  }

  return requiredFieldList as string[];
}

function validateSchemaRequiredFields(requiredFields: string[]): void {
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
      requiredFields.includes(field),
      `log-event schema missing required field: ${field}`,
    );
  }
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
}

function main(): void {
  const repoRoot = resolve(__dirname, "../..");
  const requiredFields = loadLogEventSchemaRequiredFields(repoRoot);

  validateSchemaRequiredFields(requiredFields);
  validateRuntimeRecordBehavior();

  process.stdout.write("G7 logging validation passed.\n");
}

main();
