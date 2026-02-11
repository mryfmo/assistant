import { context as otelContext, trace } from "@opentelemetry/api";

const traceIdPattern = /^[0-9a-f]{32}$/;
const spanIdPattern = /^[0-9a-f]{16}$/;

export type TraceCorrelationContext = {
  traceId: string;
  spanId: string;
};

export type TraceLogFields = {
  trace_id: string;
  span_id: string;
};

export function isValidTraceId(value: string): boolean {
  return traceIdPattern.test(value);
}

export function isValidSpanId(value: string): boolean {
  return spanIdPattern.test(value);
}

export function toTraceLogFields(context: TraceCorrelationContext): TraceLogFields {
  return {
    trace_id: context.traceId,
    span_id: context.spanId,
  };
}

export function parseTraceCorrelationContext(input: {
  traceId?: string;
  spanId?: string;
}): TraceCorrelationContext | undefined {
  if (input.traceId === undefined && input.spanId === undefined) {
    return undefined;
  }

  if (input.traceId === undefined || input.spanId === undefined) {
    throw new Error(
      "Invalid trace correlation context: traceId and spanId must be provided together.",
    );
  }

  if (!isValidTraceId(input.traceId)) {
    throw new Error("Invalid traceId format. Expected 32 lowercase hexadecimal characters.");
  }

  if (!isValidSpanId(input.spanId)) {
    throw new Error("Invalid spanId format. Expected 16 lowercase hexadecimal characters.");
  }

  return {
    traceId: input.traceId,
    spanId: input.spanId,
  };
}

export function getActiveTraceCorrelationContext(): TraceCorrelationContext | undefined {
  const activeSpan = trace.getSpan(otelContext.active());
  if (!activeSpan) {
    return undefined;
  }

  const activeContext = activeSpan.spanContext();
  if (!isValidTraceId(activeContext.traceId) || !isValidSpanId(activeContext.spanId)) {
    return undefined;
  }

  return {
    traceId: activeContext.traceId,
    spanId: activeContext.spanId,
  };
}
