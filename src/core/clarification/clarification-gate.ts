import { type ClarificationQuestion, formatClarificationQuestion } from "./question-format";

type ClarificationDecision = "proceed" | "cancel";

type PendingClarification = {
  question: ClarificationQuestion;
  resolvedDecision?: ClarificationDecision;
};

export type ClarificationGateResult =
  | {
      status: "clear";
    }
  | {
      status: "blocked";
      question: ClarificationQuestion;
    };

export type ClarificationResumeResult =
  | {
      allowed: true;
      decision: "proceed";
    }
  | {
      allowed: false;
      decision: "cancel" | "pending";
      question?: ClarificationQuestion;
    };

function isAmbiguousIntent(intent: string): boolean {
  const normalized = intent.toLowerCase();
  return (
    normalized.includes("something") ||
    normalized.includes("somehow") ||
    normalized.includes("maybe") ||
    normalized.includes("probably")
  );
}

function isHighRiskIntent(intent: string): boolean {
  const normalized = intent.toLowerCase();
  return (
    normalized.includes("delete") ||
    normalized.includes("drop") ||
    normalized.includes("production") ||
    normalized.includes("billing") ||
    normalized.includes("credential") ||
    normalized.includes("secret")
  );
}

export class ClarificationGate {
  private readonly pendingByWorkflow = new Map<string, PendingClarification>();

  evaluateIntent(input: {
    workflow_id: string;
    intent: string;
    force_ambiguous?: boolean;
    force_high_risk?: boolean;
  }): ClarificationGateResult {
    const pending = this.pendingByWorkflow.get(input.workflow_id);
    if (pending !== undefined && pending.resolvedDecision === undefined) {
      return {
        status: "blocked",
        question: pending.question,
      };
    }

    const ambiguous = input.force_ambiguous ?? isAmbiguousIntent(input.intent);
    const highRisk = input.force_high_risk ?? isHighRiskIntent(input.intent);

    if (!ambiguous && !highRisk) {
      return { status: "clear" };
    }

    const question = formatClarificationQuestion({
      workflow_id: input.workflow_id,
      intent: input.intent,
      reason: highRisk ? "high_risk" : "ambiguous",
    });

    this.pendingByWorkflow.set(input.workflow_id, { question });

    return {
      status: "blocked",
      question,
    };
  }

  resolveClarification(input: {
    workflow_id: string;
    decision: ClarificationDecision;
  }): boolean {
    const pending = this.pendingByWorkflow.get(input.workflow_id);
    if (pending === undefined) {
      return false;
    }

    pending.resolvedDecision = input.decision;
    return true;
  }

  resumeExecution(input: {
    workflow_id: string;
    defaultDecision?: ClarificationDecision;
  }): ClarificationResumeResult {
    const pending = this.pendingByWorkflow.get(input.workflow_id);
    if (pending === undefined) {
      return {
        allowed: true,
        decision: "proceed",
      };
    }

    const decision = pending.resolvedDecision ?? input.defaultDecision;
    if (decision === undefined) {
      return {
        allowed: false,
        decision: "pending",
        question: pending.question,
      };
    }

    if (decision === "cancel") {
      return {
        allowed: false,
        decision,
      };
    }

    this.pendingByWorkflow.delete(input.workflow_id);
    return {
      allowed: true,
      decision,
    };
  }
}
