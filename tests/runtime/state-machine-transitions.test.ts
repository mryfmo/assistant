import assert from "node:assert/strict";
import test from "node:test";

import { canTransitionTaskState } from "../../src/core/domain/state-machine";

test("closed-set state machine accepts legal transitions", () => {
  const legalEdges: Array<
    [Parameters<typeof canTransitionTaskState>[0], Parameters<typeof canTransitionTaskState>[1]]
  > = [
    ["queued", "leased"],
    ["leased", "running"],
    ["running", "succeeded"],
    ["running", "failed"],
    ["running", "retry_wait"],
    ["retry_wait", "queued"],
  ];

  for (const [from, to] of legalEdges) {
    assert.equal(canTransitionTaskState(from, to).ok, true);
  }
});

test("closed-set state machine rejects illegal transitions deterministically", () => {
  const illegal = canTransitionTaskState("queued", "succeeded");
  assert.equal(illegal.ok, false);
  if (!illegal.ok) {
    assert.equal(illegal.code, "ILLEGAL_TASK_TRANSITION");
    assert.equal(illegal.message.includes("queued -> succeeded"), true);
  }
});
