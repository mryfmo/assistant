# Purpose

Define compatibility layer for OhMyOpenCode agent profiles.

# Contract(s)

- `contracts/jsonschema/subagent-request.v1.json`
- `contracts/jsonschema/subagent-result.v1.json`

# Required Behaviors

- Adapter MUST treat OhMyOpenCode extensions as optional fields.
- Unsupported extension fields MUST be ignored unless explicitly mapped.

# Failure Modes

Profile mismatch, unsupported capability mapping.

# Validation (Tests + Gates)

Compatibility checks in G5 and G6 under the `spec-pack` profile (spec-consistency depth). Under `runtime-implementation`, G5 and G6 additionally validate live integration and end-to-end behavior.
