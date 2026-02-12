# Purpose

Define browser automation integration for sandbox and production execution.

# Contract(s)

- `contracts/jsonschema/task-spec.v1.json`
- `contracts/jsonschema/task-result.v1.json`

# Required Behaviors

- Chrome tasks MUST run in sandbox before production.
- Allowed URL domains MUST be validated against policy allowlist.
- Screenshots and trace artifacts MUST be emitted for dry-run evidence.

# Failure Modes

Selector drift, auth expiration, blocked navigation.

# Validation (Tests + Gates)

G6 includes browser-automation spec-consistency assertions under the `spec-pack` profile. Under `runtime-implementation`, G6 additionally validates live browser automation end-to-end flow.
