import assert from "node:assert/strict";
import test from "node:test";

import { ApprovalGate } from "../../src/core/promotion/approval-gate";
import { PromotionController } from "../../src/core/promotion/promotion-controller";

test("M10 runtime path: promotion controller enforces approval path and executes rollback trigger", () => {
  const approvals = new ApprovalGate();
  const controller = new PromotionController(approvals, { now: () => 1_000 });

  approvals.recordApproval({
    workflow_id: "wf-promo-rollback-1",
    boundary: "sandbox->staging",
    approver_id: "approver-a",
    approved_at_unix_ms: 1_001,
  });
  approvals.recordApproval({
    workflow_id: "wf-promo-rollback-1",
    boundary: "staging->prod",
    approver_id: "approver-b",
    approved_at_unix_ms: 1_002,
  });

  const toStaging = controller.promote({
    workflow_id: "wf-promo-rollback-1",
    to_stage: "staging",
    artifacts: [
      {
        artifact_id: "a1",
        workflow_id: "wf-promo-rollback-1",
        task_id: "wf-promo-rollback-1:task:0001",
        uri: "evidence://sandbox/dry-run/run-1",
        digest: "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        created_at: 1_003,
      },
    ],
  });
  assert.equal(toStaging.ok, true);

  const toProd = controller.promote({
    workflow_id: "wf-promo-rollback-1",
    to_stage: "prod",
  });
  assert.equal(toProd.ok, true);
  assert.equal(controller.currentStage("wf-promo-rollback-1"), "prod");

  const rollback = controller.evaluateRuntimeHealthAndRollback({
    workflow_id: "wf-promo-rollback-1",
    errorRate: 0.002,
    currentBreachDurationSeconds: 301,
  });

  assert.equal(rollback.rolledBack, true);
  assert.equal(rollback.stage, "staging");
  assert.equal(controller.currentStage("wf-promo-rollback-1"), "staging");
});
