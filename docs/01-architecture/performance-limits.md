# Purpose

Define hard limits and default runtime controls.

# Scope

Task execution, scheduling, retries, and queue behavior.

# Definitions

- Hard limit: value that MUST be enforced at runtime.

# Requirements (Traceable)

- ORCH-OPS-6010: Runtime limits MUST be centrally configurable.

# Hard Limits (Numeric)

- Max active workflows per tenant: 200
- Max retries per task: 3
- Max task payload size: 512 KB

# Default Timeouts

- Plan stage timeout: 60s
- Task lease TTL: 30s
- Task execution timeout: 300s

# Load Shedding Rules

- Reject new low-priority work when queue depth exceeds threshold.

# Validation

Stress tests validate limit enforcement.

# Failure Modes

Queue overload and timeout storm.

# Operational Notes

Tune limits by environment profile.
