# Purpose

Define closed-set workflow and task states.

# Scope

Workflow lifecycle and task lifecycle transitions.

# Definitions

- Terminal states: done, failed, cancelled.

# Requirements (Traceable)

- ORCH-CORE-0003: Illegal state transitions MUST be rejected.

# Task States (Closed Set)

- queued
- leased
- running
- retry_wait
- succeeded
- failed
- cancelled

# Allowed Transitions (Closed Set)

- queued -> leased
- leased -> running
- running -> succeeded|failed|retry_wait|cancelled
- retry_wait -> queued

# Lease Rules

- Lease TTL MUST be renewed by heartbeat.
- Expired lease returns task to queued state.

# Idempotency Rules

- Same idempotency key MUST produce one logical side effect.

# Validation

State-machine tests for allowed and forbidden transitions.

# Failure Modes

Lost heartbeat, duplicate lease race.

# Operational Notes

Use DB constraints plus API-level guards.
