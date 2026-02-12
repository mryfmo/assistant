import assert from "node:assert/strict";
import test from "node:test";

import {
  createErrorEnvelope,
  isErrorCode,
  isRetryableErrorCode,
} from "../../src/core/contracts/error-envelope";

test("createErrorEnvelope infers retryable from error code", () => {
  const retryable = createErrorEnvelope({
    code: "LEASE_CONFLICT",
    message: "lease conflict",
    requestId: "req-1",
  });

  const nonRetryable = createErrorEnvelope({
    code: "FORBIDDEN",
    message: "forbidden",
    requestId: "req-2",
  });

  assert.equal(retryable.retryable, true);
  assert.equal(nonRetryable.retryable, false);
});

test("createErrorEnvelope redacts sensitive key-value segments", () => {
  const envelope = createErrorEnvelope({
    code: "INVALID_REQUEST",
    message: "password=abc123 authorization=Bearer token-123",
    requestId: "req-3",
  });

  assert.equal(envelope.message.includes("abc123"), false);
  assert.equal(envelope.message.includes("token-123"), false);
  assert.equal(envelope.message.includes("[REDACTED]"), true);
});

test("isErrorCode and isRetryableErrorCode reflect closed-set policy", () => {
  assert.equal(isErrorCode("TASK_TIMEOUT"), true);
  assert.equal(isErrorCode("NOT_A_CODE"), false);
  assert.equal(isRetryableErrorCode("TASK_TIMEOUT"), true);
  assert.equal(isRetryableErrorCode("POLICY_DENIED"), false);
});
