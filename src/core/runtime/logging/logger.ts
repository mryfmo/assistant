import pino, { type Logger, type LoggerOptions } from "pino";

import {
  type CorrelationContext,
  assertCorrelationContext,
  toCorrelationLogFields,
} from "./context";
import { redactLogPayload } from "./redaction";
import {
  getActiveTraceCorrelationContext,
  parseTraceCorrelationContext,
  toTraceLogFields,
} from "./trace";

export type RuntimeLogLevel = "debug" | "info" | "warn" | "error";

export type RuntimeLogEventInput = {
  level?: RuntimeLogLevel;
  timestamp?: string;
  eventType: string;
  message: string;
  context: CorrelationContext;
  traceId?: string;
  spanId?: string;
  data?: unknown;
};

export type RuntimeLogEventRecord = {
  timestamp: string;
  level: RuntimeLogLevel;
  event_type: string;
  message: string;
  workflow_id: string;
  task_id: string;
  request_id: string;
  worker_id?: string;
  trace_id?: string;
  span_id?: string;
  data?: unknown;
};

export type RuntimeLogger = {
  logger: Logger;
  emit: (event: RuntimeLogEventInput) => void;
};

export function buildRuntimeLogEventRecord(event: RuntimeLogEventInput): RuntimeLogEventRecord {
  assertCorrelationContext(event.context);

  const correlationFields = toCorrelationLogFields(event.context);
  const explicitTraceContext = parseTraceCorrelationContext({
    traceId: event.traceId,
    spanId: event.spanId,
  });
  const traceContext = explicitTraceContext ?? getActiveTraceCorrelationContext();
  const traceFields = traceContext ? toTraceLogFields(traceContext) : {};

  return {
    timestamp: event.timestamp ?? new Date().toISOString(),
    level: event.level ?? "info",
    event_type: event.eventType,
    message: event.message,
    ...correlationFields,
    ...traceFields,
    data: redactLogPayload(event.data),
  };
}

function emitByLevel(logger: Logger, event: RuntimeLogEventRecord): void {
  switch (event.level) {
    case "debug":
      logger.debug(event);
      return;
    case "warn":
      logger.warn(event);
      return;
    case "error":
      logger.error(event);
      return;
    default:
      logger.info(event);
  }
}

export function createRuntimeLogger(options: LoggerOptions = {}): RuntimeLogger {
  const logger = pino({
    base: undefined,
    messageKey: "message",
    timestamp: false,
    redact: {
      paths: [
        "data.password",
        "data.secret",
        "data.token",
        "data.apiKey",
        "data.authorization",
        "data.cookie",
      ],
      censor: "[REDACTED]",
      remove: false,
    },
    ...options,
  });

  return {
    logger,
    emit: (event: RuntimeLogEventInput) => {
      const record = buildRuntimeLogEventRecord(event);
      emitByLevel(logger, record);
    },
  };
}
