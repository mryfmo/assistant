# Purpose

Define required telemetry for debugging, auditing, and SLO management.

# Scope

Logs, metrics, traces, and audit records.

# Definitions

- Audit event: immutable record tied to workflow and actor.

# Requirements (Traceable)

- ORCH-OPS-6002: Every task event MUST include correlation IDs.
- ORCH-OPS-6003: Runtime logs MUST include `trace_id` and `span_id` when trace context is available.
- ORCH-SEC-5002: Secrets MUST NOT appear in runtime logs.

# Logs (Schema)

Required fields: `timestamp`, `level`, `workflow_id`, `task_id`, `request_id`, `worker_id`, `event_type`.
Optional trace linkage fields: `trace_id`, `span_id`.

Schema contract: `contracts/jsonschema/log-event.v1.json`.

# Metrics (Closed Set)

- workflow_duration_seconds
- task_retry_count
- lease_expiry_count
- clarification_rounds

# Traces (Spans)

Spans required for planning, compilation, dispatch, execution, and artifact upload.

# SLOs (Numeric Targets)

- p95 dispatch latency < 2s
- task success ratio >= 99.0% (non-user-error)

# Validation

Telemetry schema tests and dashboard integrity checks.
Gate validation runs through `bun run check:g7-logging`.

# Failure Modes

Missing correlation IDs, cardinality explosion.

# Operational Notes

Use sampling only where it does not break audit requirements.
