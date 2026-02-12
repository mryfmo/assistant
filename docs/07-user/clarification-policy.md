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
- If no response is received, apply default only when both policy allows and the caller explicitly provides `defaultDecision`; otherwise execution remains blocked with `pending` status and an audit note is recorded.

## Default Application Policy

- A default may be applied only when both conditions are met: policy allows default application and `defaultDecision` is present.
- For high-risk intent, the operational default SHOULD be `cancel` unless an explicit override policy is recorded.
