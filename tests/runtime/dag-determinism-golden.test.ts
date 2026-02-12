import assert from "node:assert/strict";
import test from "node:test";

import { stablePlanGraphJson } from "../../src/core/planning/dag-determinism";
import { buildDeterministicPlanGraph } from "../../src/core/planning/plan-agent";

test("Plan Agent DAG generation is deterministic with stable golden output", () => {
  const input = {
    workflow_id: "wf-golden-1",
    intent: "provision deployment with production credentials",
    ambiguous: true,
    high_risk: true,
  } as const;

  const runOne = stablePlanGraphJson(buildDeterministicPlanGraph(input));
  const runTwo = stablePlanGraphJson(buildDeterministicPlanGraph(input));

  const expected =
    '{"workflow_id":"wf-golden-1","nodes":[{"id":"plan:analyze","kind":"plan"},{"id":"clarification:resolve","kind":"clarification"},{"id":"approval:checkpoint","kind":"approval"},{"id":"task:execute","kind":"task"}],"edges":[{"from":"approval:checkpoint","to":"task:execute"},{"from":"clarification:resolve","to":"approval:checkpoint"},{"from":"plan:analyze","to":"clarification:resolve"}]}';

  assert.equal(runOne, runTwo);
  assert.equal(runOne, expected);
});
