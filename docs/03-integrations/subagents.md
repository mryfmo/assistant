# Purpose

Define subagent invocation contracts and safety boundaries.

# Contract(s)

- `contracts/jsonschema/subagent-request.v1.json`
- `contracts/jsonschema/subagent-result.v1.json`

# Required Behaviors

- Subagent requests MUST include explicit tool constraints.
- Subagent outputs MUST be converted to typed task artifacts.

# Failure Modes

Timeout, malformed output, policy violation.

# Validation (Tests + Gates)

Validated by G1 contract tests and G6 E2E scenarios.
