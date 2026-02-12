export type PlanNodeKind = "plan" | "clarification" | "task" | "approval";

export type PlanNode = {
  id: string;
  kind: PlanNodeKind;
};

export type PlanEdge = {
  from: string;
  to: string;
};

export type PlanGraph = {
  workflow_id: string;
  nodes: PlanNode[];
  edges: PlanEdge[];
};

const nodeKindRank: Record<PlanNodeKind, number> = {
  plan: 0,
  clarification: 1,
  approval: 2,
  task: 3,
};

function compareNode(left: PlanNode, right: PlanNode): number {
  if (left.kind !== right.kind) {
    return nodeKindRank[left.kind] - nodeKindRank[right.kind];
  }

  return left.id.localeCompare(right.id);
}

function compareEdge(left: PlanEdge, right: PlanEdge): number {
  if (left.from !== right.from) {
    return left.from.localeCompare(right.from);
  }

  return left.to.localeCompare(right.to);
}

export function canonicalizePlanGraph(plan: PlanGraph): PlanGraph {
  const nodeById = new Map<string, PlanNode>();
  for (const node of plan.nodes) {
    nodeById.set(node.id, node);
  }

  const nodes = [...nodeById.values()].sort(compareNode);

  const edgeKey = new Set<string>();
  const edges: PlanEdge[] = [];
  for (const edge of plan.edges) {
    if (!nodeById.has(edge.from) || !nodeById.has(edge.to)) {
      continue;
    }
    const key = `${edge.from}->${edge.to}`;
    if (edgeKey.has(key)) {
      continue;
    }
    edgeKey.add(key);
    edges.push({ from: edge.from, to: edge.to });
  }

  edges.sort(compareEdge);

  return {
    workflow_id: plan.workflow_id,
    nodes,
    edges,
  };
}

export function stablePlanGraphJson(plan: PlanGraph): string {
  return JSON.stringify(canonicalizePlanGraph(plan));
}
