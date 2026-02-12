export type ClarificationOption = {
  id: "proceed" | "cancel";
  label: string;
};

export type ClarificationQuestion = {
  workflow_id: string;
  question_id: string;
  prompt: string;
  options: ClarificationOption[];
  recommended_option_id: "proceed" | "cancel";
  consequence: string;
};

function compactIntent(intent: string): string {
  const cleaned = intent.trim().replace(/\s+/g, " ");
  return cleaned.length <= 80 ? cleaned : `${cleaned.slice(0, 77)}...`;
}

export function formatClarificationQuestion(input: {
  workflow_id: string;
  reason: "ambiguous" | "high_risk";
  intent: string;
}): ClarificationQuestion {
  const reasonText =
    input.reason === "high_risk"
      ? "This request may impact production or sensitive resources."
      : "This request is ambiguous and could be interpreted in multiple ways.";

  return {
    workflow_id: input.workflow_id,
    question_id: `${input.workflow_id}:clarification:1`,
    prompt: `${reasonText} Please confirm how to proceed for: "${compactIntent(input.intent)}"`,
    options: [
      {
        id: "proceed",
        label: "Proceed with execution",
      },
      {
        id: "cancel",
        label: "Cancel this workflow",
      },
    ],
    recommended_option_id: input.reason === "high_risk" ? "cancel" : "proceed",
    consequence: "Execution remains blocked until you answer this question.",
  };
}
