import { type PlanGraph, type PlanNode, canonicalizePlanGraph } from "./dag-determinism";

export type PlanAgentInput = {
  workflow_id: string;
  intent: string;
  ambiguous: boolean;
  high_risk: boolean;
};

function requiredNodes(input: PlanAgentInput): PlanNode[] {
  const nodes: PlanNode[] = [
    {
      id: "plan:analyze",
      kind: "plan",
    },
  ];

  if (input.ambiguous || input.high_risk) {
    nodes.push({
      id: "clarification:resolve",
      kind: "clarification",
    });
  }

  if (input.high_risk) {
    nodes.push({
      id: "approval:checkpoint",
      kind: "approval",
    });
  }

  nodes.push({
    id: "task:execute",
    kind: "task",
  });

  return nodes;
}

export function buildDeterministicPlanGraph(input: PlanAgentInput): PlanGraph {
  const nodes = requiredNodes(input);
  const hasClarification = nodes.some((node) => node.kind === "clarification");
  const hasApproval = nodes.some((node) => node.kind === "approval");

  const edges: PlanGraph["edges"] = [];

  if (hasClarification) {
    edges.push({ from: "plan:analyze", to: "clarification:resolve" });
  }

  if (hasApproval) {
    edges.push({
      from: hasClarification ? "clarification:resolve" : "plan:analyze",
      to: "approval:checkpoint",
    });
  }

  edges.push({
    from: hasApproval
      ? "approval:checkpoint"
      : hasClarification
        ? "clarification:resolve"
        : "plan:analyze",
    to: "task:execute",
  });

  return canonicalizePlanGraph({
    workflow_id: input.workflow_id,
    nodes,
    edges,
  });
}
