import { type ErrorCode, isErrorCode, isRetryableErrorCode } from "../contracts/error-envelope";

export type RetryDecision = {
  shouldRetry: boolean;
  reason:
    | "SUCCESS"
    | "MISSING_ERROR_CODE"
    | "UNKNOWN_ERROR_CODE"
    | "NON_RETRYABLE_CODE"
    | "MAX_RETRY_REACHED"
    | "RETRYABLE";
  errorCode?: ErrorCode;
};

export function evaluateRetryDecision(input: {
  success: boolean;
  errorCode?: string;
  retryCount: number;
  maxRetry: number;
}): RetryDecision {
  if (input.success) {
    return { shouldRetry: false, reason: "SUCCESS" };
  }

  if (input.errorCode === undefined) {
    return { shouldRetry: false, reason: "MISSING_ERROR_CODE" };
  }

  if (!isErrorCode(input.errorCode)) {
    return { shouldRetry: false, reason: "UNKNOWN_ERROR_CODE" };
  }

  if (!isRetryableErrorCode(input.errorCode)) {
    return { shouldRetry: false, reason: "NON_RETRYABLE_CODE", errorCode: input.errorCode };
  }

  if (input.retryCount >= input.maxRetry) {
    return { shouldRetry: false, reason: "MAX_RETRY_REACHED", errorCode: input.errorCode };
  }

  return { shouldRetry: true, reason: "RETRYABLE", errorCode: input.errorCode };
}

export function retryBackoffMs(retryCount: number): number {
  const boundedExponent = Math.min(retryCount, 8);
  return 1_000 * 2 ** boundedExponent;
}
