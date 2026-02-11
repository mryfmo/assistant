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

Compatibility tests in G5 and G6.
