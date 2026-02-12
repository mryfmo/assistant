import assert from "node:assert/strict";
import test from "node:test";

import { ApprovalGate } from "../../src/core/promotion/approval-gate";
import { PromotionController } from "../../src/core/promotion/promotion-controller";

test("promotion path enforces sandbox -> staging -> prod only", () => {
  const approvals = new ApprovalGate();
  const controller = new PromotionController(approvals, { now: () => 1_000 });

  approvals.recordApproval({
    workflow_id: "wf-promo-path-1",
    boundary: "sandbox->staging",
    approver_id: "approver-a",
    approved_at_unix_ms: 1_001,
  });
  approvals.recordApproval({
    workflow_id: "wf-promo-path-1",
    boundary: "staging->prod",
    approver_id: "approver-b",
    approved_at_unix_ms: 1_002,
  });

  const direct = controller.promote({
    workflow_id: "wf-promo-path-1",
    to_stage: "prod",
    artifacts: [
      {
        artifact_id: "a1",
        workflow_id: "wf-promo-path-1",
        task_id: "wf-promo-path-1:task:0001",
        uri: "evidence://sandbox/dry-run/run-1",
        digest: "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        created_at: 1_003,
      },
    ],
  });

  assert.equal(direct.ok, false);
  if (direct.ok) {
    throw new Error("expected direct sandbox->prod to be denied");
  }
  assert.equal(direct.code, "POLICY_DENIED");
  assert.equal(controller.currentStage("wf-promo-path-1"), "sandbox");
});
