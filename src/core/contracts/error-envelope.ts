export const errorCodes = [
  "INVALID_REQUEST",
  "CONTRACT_MISMATCH",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "LEASE_CONFLICT",
  "TASK_TIMEOUT",
  "DEPENDENCY_FAILURE",
  "POLICY_DENIED",
  "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof errorCodes)[number];

export type ErrorEnvelope = {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  request_id: string;
};

const retryableErrorCodeSet = new Set<ErrorCode>([
  "LEASE_CONFLICT",
  "TASK_TIMEOUT",
  "DEPENDENCY_FAILURE",
]);

function assertNonEmptyString(value: string, fieldName: string): void {
  if (value.trim().length === 0) {
    throw new Error(`Invalid error envelope: ${fieldName} must be a non-empty string.`);
  }
}

function redactSensitiveSegments(input: string): string {
  return input
    .replace(/authorization\s*[:=]\s*Bearer\s+[A-Za-z0-9._~+\-/]+=*/gi, "authorization=[REDACTED]")
    .replace(
      /(password|secret|token|api[-_]?key|authorization|cookie)\s*[:=]\s*([^\s,;]+)/gi,
      (_, key: string) => `${key}=[REDACTED]`,
    )
    .replace(/Bearer\s+[A-Za-z0-9._~+\-/]+=*/gi, "Bearer [REDACTED]");
}

export function isErrorCode(value: string): value is ErrorCode {
  return (errorCodes as readonly string[]).includes(value);
}

export function isRetryableErrorCode(code: ErrorCode): boolean {
  return retryableErrorCodeSet.has(code);
}

export function createErrorEnvelope(input: {
  code: ErrorCode;
  message: string;
  requestId: string;
  retryable?: boolean;
}): ErrorEnvelope {
  assertNonEmptyString(input.message, "message");
  assertNonEmptyString(input.requestId, "request_id");

  return {
    code: input.code,
    message: redactSensitiveSegments(input.message),
    retryable: input.retryable ?? isRetryableErrorCode(input.code),
    request_id: input.requestId,
  };
}
