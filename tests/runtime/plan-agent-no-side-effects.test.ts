import assert from "node:assert/strict";
import test from "node:test";

import { RuntimePersistenceDb } from "../../src/core/persistence/db";
import { buildDeterministicPlanGraph } from "../../src/core/planning/plan-agent";

test("Plan Agent generates plan-only graph without execution side effects", () => {
  const db = new RuntimePersistenceDb();
  const before = db.snapshot();

  const graph = buildDeterministicPlanGraph({
    workflow_id: "wf-plan-agent-1",
    intent: "delete every user account",
    ambiguous: true,
    high_risk: true,
  });

  const after = db.snapshot();

  assert.equal(before.workflows.size, 0);
  assert.equal(before.tasks.size, 0);
  assert.equal(after.workflows.size, 0);
  assert.equal(after.tasks.size, 0);

  assert.equal(graph.workflow_id, "wf-plan-agent-1");
  assert.equal(
    graph.nodes.some((node) => node.kind === "task" && node.id === "task:execute"),
    true,
  );
});
