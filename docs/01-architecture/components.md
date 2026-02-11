# Purpose

Define components and responsibilities with strict boundaries.

# Scope

Control plane, worker plane, skill runtime, integration adapters.

# Definitions

- Control plane: orchestration brain and policy engine.
- Worker: task execution process.

# Requirements (Traceable)

- ORCH-CORE-0010: Components MUST communicate through versioned contracts.

# Component Responsibilities

- OpenWork UI: intent input, clarification UI, approvals, audit visibility.
- Orchestrator: scheduling, lease, retry, state transitions.
- Worker: deterministic task execution.
- Artifact service: immutable artifact storage and indexing.

# Component Interfaces

All interfaces are defined in proto/jsonschema contract files.

# Component Failure Boundaries

Worker failure MUST NOT corrupt global workflow state.

# Validation

Integration tests must simulate isolated component failures.

# Failure Modes

Adapter timeout, queue saturation, stale lease.

# Operational Notes

Deploy worker pools independently from control plane.
