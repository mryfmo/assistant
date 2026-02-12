import assert from "node:assert/strict";
import test from "node:test";

import { ApprovalGate } from "../../src/core/promotion/approval-gate";
import { PromotionController } from "../../src/core/promotion/promotion-controller";

function validEvidence(workflowId: string) {
  return [
    {
      artifact_id: `${workflowId}:a1`,
      workflow_id: workflowId,
      task_id: `${workflowId}:task:0001`,
      uri: "evidence://sandbox/dry-run/run-1",
      digest: "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      created_at: 2_000,
    },
  ];
}

test("promotion requires explicit approvals for each boundary", () => {
  const approvals = new ApprovalGate();
  const controller = new PromotionController(approvals, { now: () => 2_100 });

  const noApproval = controller.promote({
    workflow_id: "wf-approval-1",
    to_stage: "staging",
    artifacts: validEvidence("wf-approval-1"),
  });
  assert.equal(noApproval.ok, false);
  if (noApproval.ok) {
    throw new Error("expected missing approval failure");
  }
  assert.equal(noApproval.code, "POLICY_DENIED");

  approvals.recordApproval({
    workflow_id: "wf-approval-1",
    boundary: "sandbox->staging",
    approver_id: "approver-a",
    approved_at_unix_ms: 2_101,
  });

  const toStaging = controller.promote({
    workflow_id: "wf-approval-1",
    to_stage: "staging",
    artifacts: validEvidence("wf-approval-1"),
  });
  assert.equal(toStaging.ok, true);

  const noProdApproval = controller.promote({
    workflow_id: "wf-approval-1",
    to_stage: "prod",
  });
  assert.equal(noProdApproval.ok, false);
  if (noProdApproval.ok) {
    throw new Error("expected missing staging->prod approval failure");
  }
  assert.equal(noProdApproval.code, "POLICY_DENIED");

  approvals.recordApproval({
    workflow_id: "wf-approval-1",
    boundary: "staging->prod",
    approver_id: "approver-b",
    approved_at_unix_ms: 2_102,
  });

  const toProd = controller.promote({
    workflow_id: "wf-approval-1",
    to_stage: "prod",
  });
  assert.equal(toProd.ok, true);
  assert.equal(controller.currentStage("wf-approval-1"), "prod");
});
