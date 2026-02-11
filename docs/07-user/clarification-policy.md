# Clarification Protocol

When intent is ambiguous or risky, the system MUST ask clarifying questions before execution.

## Question Rules

- One question at a time.
- Maximum four options.
- Plain language only.
- Include one recommended default option.

## Required Fields per Question

- question
- reason
- options
- recommended_default
- consequence_if_selected

## Escalation Rules

- Blocking clarification prevents execution.
- If no response is received, apply default only when policy allows and record audit note.
