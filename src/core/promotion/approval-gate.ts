export type PromotionBoundary = "sandbox->staging" | "staging->prod";

export type ApprovalRecord = {
  workflow_id: string;
  boundary: PromotionBoundary;
  approver_id: string;
  approved_at_unix_ms: number;
};

export class ApprovalGate {
  private readonly approvalsByWorkflow = new Map<string, ApprovalRecord[]>();

  recordApproval(input: {
    workflow_id: string;
    boundary: PromotionBoundary;
    approver_id: string;
    approved_at_unix_ms: number;
  }): ApprovalRecord {
    const record: ApprovalRecord = {
      workflow_id: input.workflow_id,
      boundary: input.boundary,
      approver_id: input.approver_id,
      approved_at_unix_ms: input.approved_at_unix_ms,
    };

    const existing = this.approvalsByWorkflow.get(input.workflow_id) ?? [];
    this.approvalsByWorkflow.set(input.workflow_id, [...existing, record]);

    return record;
  }

  hasApproval(workflowId: string, boundary: PromotionBoundary): boolean {
    const approvals = this.approvalsByWorkflow.get(workflowId) ?? [];
    return approvals.some((approval) => approval.boundary === boundary);
  }

  listApprovals(workflowId: string): ApprovalRecord[] {
    return [...(this.approvalsByWorkflow.get(workflowId) ?? [])];
  }
}
