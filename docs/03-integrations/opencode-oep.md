# Purpose

Define OpenCode Execution Protocol adapter behavior.

# Contract(s)

- `contracts/jsonschema/oep-message.v1.json`

# Required Behaviors

- Adapter MUST map orchestrator tasks to OEP request envelopes.
- Adapter MUST support cancellation and timeout propagation.

# Failure Modes

Transport interruption, schema mismatch.

# Validation (Tests + Gates)

Contract tests in G1 and G5 spec-consistency checks under the `spec-pack` profile. Under `runtime-implementation`, G5 additionally validates live cross-component integration behavior.
