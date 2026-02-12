import type { ArtifactRecord } from "../persistence/types";
import { assertSandboxDryRunEvidence } from "../skills/sandbox-dryrun";
import type { ApprovalGate, PromotionBoundary } from "./approval-gate";

export type PromotionStage = "sandbox" | "staging" | "prod";

export type PromotionAuditEvent = {
  workflow_id: string;
  from_stage: PromotionStage;
  to_stage: PromotionStage;
  allowed: boolean;
  reason:
    | "PROMOTED"
    | "IDEMPOTENT"
    | "INVALID_PATH"
    | "BYPASS_DENIED"
    | "MISSING_APPROVAL"
    | "MISSING_SANDBOX_EVIDENCE";
  timestamp_unix_ms: number;
};

export type PromotionResult =
  | {
      ok: true;
      stage: PromotionStage;
    }
  | {
      ok: false;
      code: "POLICY_DENIED" | "FORBIDDEN";
      message: string;
      stage: PromotionStage;
    };

function requiredBoundary(from: PromotionStage, to: PromotionStage): PromotionBoundary | undefined {
  if (from === "sandbox" && to === "staging") {
    return "sandbox->staging";
  }
  if (from === "staging" && to === "prod") {
    return "staging->prod";
  }

  return undefined;
}

export class PromotionController {
  private readonly stageByWorkflow = new Map<string, PromotionStage>();
  private readonly auditTrail: PromotionAuditEvent[] = [];

  constructor(
    private readonly approvalGate: ApprovalGate,
    private readonly clock: { now: () => number } = { now: () => Date.now() },
  ) {}

  currentStage(workflowId: string): PromotionStage {
    return this.stageByWorkflow.get(workflowId) ?? "sandbox";
  }

  listAuditTrail(workflowId: string): PromotionAuditEvent[] {
    return this.auditTrail.filter((event) => event.workflow_id === workflowId);
  }

  promote(input: {
    workflow_id: string;
    to_stage: PromotionStage;
    artifacts?: ArtifactRecord[];
    bypass?: boolean;
  }): PromotionResult {
    const fromStage = this.currentStage(input.workflow_id);

    if (input.bypass === true) {
      this.audit(input.workflow_id, fromStage, input.to_stage, false, "BYPASS_DENIED");
      return {
        ok: false,
        code: "FORBIDDEN",
        message: "Bypass promotion is forbidden by policy.",
        stage: fromStage,
      };
    }

    if (fromStage === input.to_stage) {
      this.audit(input.workflow_id, fromStage, input.to_stage, true, "IDEMPOTENT");
      return {
        ok: true,
        stage: fromStage,
      };
    }

    const boundary = requiredBoundary(fromStage, input.to_stage);
    if (boundary === undefined) {
      this.audit(input.workflow_id, fromStage, input.to_stage, false, "INVALID_PATH");
      return {
        ok: false,
        code: "POLICY_DENIED",
        message: `Direct ${fromStage}->${input.to_stage} promotion is not allowed by policy.`,
        stage: fromStage,
      };
    }

    if (boundary === "sandbox->staging") {
      const evidence = assertSandboxDryRunEvidence(input.artifacts ?? []);
      if (!evidence.ok) {
        this.audit(input.workflow_id, fromStage, input.to_stage, false, "MISSING_SANDBOX_EVIDENCE");
        return {
          ok: false,
          code: evidence.code,
          message: evidence.message,
          stage: fromStage,
        };
      }
    }

    if (!this.approvalGate.hasApproval(input.workflow_id, boundary)) {
      this.audit(input.workflow_id, fromStage, input.to_stage, false, "MISSING_APPROVAL");
      return {
        ok: false,
        code: "POLICY_DENIED",
        message: `Approval is required for ${boundary} promotion.`,
        stage: fromStage,
      };
    }

    this.stageByWorkflow.set(input.workflow_id, input.to_stage);
    this.audit(input.workflow_id, fromStage, input.to_stage, true, "PROMOTED");
    return {
      ok: true,
      stage: input.to_stage,
    };
  }

  private audit(
    workflowId: string,
    fromStage: PromotionStage,
    toStage: PromotionStage,
    allowed: boolean,
    reason: PromotionAuditEvent["reason"],
  ): void {
    this.auditTrail.push({
      workflow_id: workflowId,
      from_stage: fromStage,
      to_stage: toStage,
      allowed,
      reason,
      timestamp_unix_ms: this.clock.now(),
    });
  }
}
