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

Contract tests in G1 and integration tests in G5.
