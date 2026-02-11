# Purpose

Define integration between OpenWork UI/control flow and orchestration contracts.

# Contract(s)

- `contracts/jsonschema/openwork-plan.v1.json`
- `contracts/jsonschema/task-spec.v1.json`

# Required Behaviors

- OpenWork MUST submit intent with `workflow_id`.
- OpenWork MUST render clarification prompts before execution.
- OpenWork MUST show sandbox evidence before promotion approval.

# Failure Modes

Session disconnect, stale UI state, approval timeout.

# Validation (Tests + Gates)

Covered in G6 E2E workflow tests.
