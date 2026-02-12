import assert from "node:assert/strict";
import test from "node:test";

import { ApprovalGate } from "../../src/core/promotion/approval-gate";
import { PromotionController } from "../../src/core/promotion/promotion-controller";

test("bypass attempts are denied with deterministic audit trail", () => {
  const approvals = new ApprovalGate();
  const controller = new PromotionController(approvals, { now: () => 3_000 });

  const bypassAttempt = controller.promote({
    workflow_id: "wf-bypass-1",
    to_stage: "prod",
    bypass: true,
  });

  assert.equal(bypassAttempt.ok, false);
  if (bypassAttempt.ok) {
    throw new Error("expected bypass denial");
  }
  assert.equal(bypassAttempt.code, "FORBIDDEN");

  const audit = controller.listAuditTrail("wf-bypass-1");
  assert.equal(audit.length, 1);
  assert.equal(audit[0]?.allowed, false);
  assert.equal(audit[0]?.reason, "BYPASS_DENIED");
});
