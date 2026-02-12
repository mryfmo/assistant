import assert from "node:assert/strict";
import test from "node:test";

import { createClarificationGate } from "../../src/core/orchestrator";

test("workflow resumes only after clarification resolution with selected/default policy", () => {
  const gate = createClarificationGate();

  const blocked = gate.evaluateIntent({
    workflow_id: "wf-clarify-2",
    intent: "delete prod billing data",
  });
  assert.equal(blocked.status, "blocked");

  const pendingResume = gate.resumeExecution({ workflow_id: "wf-clarify-2" });
  assert.equal(pendingResume.allowed, false);
  assert.equal(pendingResume.decision, "pending");

  const defaultCancel = gate.resumeExecution({
    workflow_id: "wf-clarify-2",
    defaultDecision: "cancel",
  });
  assert.equal(defaultCancel.allowed, false);
  assert.equal(defaultCancel.decision, "cancel");

  const resolved = gate.resolveClarification({
    workflow_id: "wf-clarify-2",
    decision: "proceed",
  });
  assert.equal(resolved, true);

  const resumed = gate.resumeExecution({ workflow_id: "wf-clarify-2" });
  assert.equal(resumed.allowed, true);
  assert.equal(resumed.decision, "proceed");
});
