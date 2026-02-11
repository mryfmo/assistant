# Purpose

Define persistent entities and data integrity constraints.

# Scope

Workflow, task, lease, artifact, approval, and event records.

# Definitions

- Lease: temporary execution ownership token.

# Requirements (Traceable)

- ORCH-DATA-2001: Task state transitions MUST be atomic.

# Tables / Collections (Required Fields)

- workflows(id, state, created_at, updated_at)
- tasks(id, workflow_id, state, retry_count, idempotency_key)
- leases(task_id, worker_id, expires_at)
- artifacts(id, workflow_id, uri, digest)

# Indexes and Constraints

- Unique(idempotency_key, workflow_id)
- Foreign keys from tasks/artifacts to workflows

# Migration Rules

- Forward-only migrations in production.
- Destructive migrations require explicit maintenance window.

# Validation

Schema migration tests and transactional state transition tests.

# Failure Modes

Deadlocks, stale leases, duplicate writes.

# Operational Notes

Use clock synchronization for lease correctness.
