import assert from "node:assert/strict";
import test from "node:test";

import { evaluateRetryDecision, retryBackoffMs } from "../../src/core/orchestrator/retry-policy";

test("retry policy matches closed-set retryability and max retry cap", () => {
  const retryable = evaluateRetryDecision({
    success: false,
    errorCode: "DEPENDENCY_FAILURE",
    retryCount: 1,
    maxRetry: 3,
  });
  assert.equal(retryable.shouldRetry, true);

  const capped = evaluateRetryDecision({
    success: false,
    errorCode: "TASK_TIMEOUT",
    retryCount: 3,
    maxRetry: 3,
  });
  assert.equal(capped.shouldRetry, false);
  assert.equal(capped.reason, "MAX_RETRY_REACHED");

  const nonRetryable = evaluateRetryDecision({
    success: false,
    errorCode: "FORBIDDEN",
    retryCount: 0,
    maxRetry: 3,
  });
  assert.equal(nonRetryable.shouldRetry, false);
  assert.equal(nonRetryable.reason, "NON_RETRYABLE_CODE");
});

test("retry backoff grows deterministically by retry count", () => {
  assert.equal(retryBackoffMs(0), 1_000);
  assert.equal(retryBackoffMs(1), 2_000);
  assert.equal(retryBackoffMs(2), 4_000);
});
