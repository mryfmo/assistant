import assert from "node:assert/strict";
import test from "node:test";

import { evaluateRollbackPolicy } from "../../src/core/promotion/rollback-policy";

test("rollback triggers when error rate threshold and duration are both exceeded", () => {
  const shouldRollback = evaluateRollbackPolicy({
    errorRate: 0.002,
    currentBreachDurationSeconds: 301,
  });
  assert.equal(shouldRollback.shouldRollback, true);
  assert.equal(shouldRollback.reason, "THRESHOLD_EXCEEDED");

  const tooShort = evaluateRollbackPolicy({
    errorRate: 0.002,
    currentBreachDurationSeconds: 120,
  });
  assert.equal(tooShort.shouldRollback, false);
  assert.equal(tooShort.reason, "DURATION_TOO_SHORT");

  const healthy = evaluateRollbackPolicy({
    errorRate: 0.0001,
    currentBreachDurationSeconds: 900,
  });
  assert.equal(healthy.shouldRollback, false);
  assert.equal(healthy.reason, "ERROR_RATE_OK");
});
