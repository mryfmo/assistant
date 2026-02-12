import assert from "node:assert/strict";
import test from "node:test";

import { ClarificationGate } from "../../src/core/clarification/clarification-gate";

test("ambiguous/high-risk intent blocks execution and emits one-question payload", () => {
  const gate = new ClarificationGate();

  const first = gate.evaluateIntent({
    workflow_id: "wf-clarify-1",
    intent: "maybe delete something in production",
  });

  assert.equal(first.status, "blocked");
  if (first.status !== "blocked") {
    throw new Error("expected blocked clarification result");
  }

  assert.equal(first.question.workflow_id, "wf-clarify-1");
  assert.equal(first.question.options.length, 2);
  assert.equal(first.question.question_id, "wf-clarify-1:clarification:1");
  assert.equal(first.question.recommended_option_id, "cancel");

  const second = gate.evaluateIntent({
    workflow_id: "wf-clarify-1",
    intent: "maybe delete something in production",
  });
  assert.equal(second.status, "blocked");
  if (second.status !== "blocked") {
    throw new Error("expected blocked clarification result");
  }

  assert.equal(second.question.question_id, first.question.question_id);
});
