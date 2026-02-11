# clarification-gate-e2e

- Requirement: `ORCH-UX-8001`
- Objective: prove ambiguous or high-risk intent triggers clarification before execution.

## Procedure

1. Submit an intentionally ambiguous high-risk request.
2. Observe workflow transitions.
3. Verify user-facing clarification prompt appears before dispatch.

## Pass Criteria

- Workflow enters clarification state before any execution dispatch.
- Blocking clarification must be resolved before execution can continue.
