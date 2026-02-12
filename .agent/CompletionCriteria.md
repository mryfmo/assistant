# Definition of Done (Canonical)

This is the single source of truth for completion criteria. `docs/06-acceptance/completion-criteria.md` is a summary reference to this file.

Implementation is complete only when all conditions below are true.

Audit sync date: 2026-02-12

## Baseline Completion (`spec-pack` profile)

The `spec-pack` profile validates specification completeness, contract consistency, and document quality. Gate checks at this level verify schema structure, document content, and traceability — not live runtime behavior.

1. All baseline gates pass in CI and local verification runs:
   - `bun run check:g0-docs`
   - `bun run check:g1-contracts`
   - `bun run lint:biome`
   - `bun run typecheck:ts`
   - `bun run check:g5-integration`
   - `bun run check:g6-e2e`
   - `bun run check:g6-topology`
   - `bun run check:g7-security`
2. Local and remote topology invariants for Plan Agent x1 and Task Execution Agents xN pass deterministic pseudo-dispatch validation (`bun run check:g6-topology`, `ORCH-INT-4001`).
3. Clarification and promotion requirements remain contract-linked and enforced in spec validation gates (`ORCH-UX-8001`, `ORCH-OPS-6001`, `ORCH-OPS-6004`).
4. Contract compatibility checks pass for protobuf and schema artifacts (`bun run check:g1-contracts`, `ORCH-API-1001`).
5. Security/logging requirements pass executable checks (`bun run check:g7-security`, `ORCH-OPS-6002`, `ORCH-OPS-6003`, `ORCH-SEC-5002`).

## Runtime Deployment Completion (`runtime-implementation` profile)

Baseline spec-pack criteria remain green throughout. Each phase adds runtime depth.

### Completion Status Levels (Runtime Profile)

- `implemented-local`: feature exists and passes local or in-memory runtime tests.
- `validated-runtime`: feature is validated in the target runtime environment named by the milestone (for example real Postgres, mTLS, or remote workers).
- `phase-closed`: milestone checks and exit gates are complete with recorded evidence.

A milestone MUST NOT be marked complete when it is only `implemented-local` and the milestone text requires `validated-runtime` evidence.

### Phase 1 — Contract Service Skeletons (M5)

- Test runner configured and `test` script in `package.json`.
- gRPC services start and reject invalid/version-mismatched requests (`ORCH-CORE-0010`).
- Correlation context and trace context propagated via gRPC interceptors (`ORCH-OPS-6002`, `ORCH-OPS-6003`).
- Runtime limits centrally configurable via environment (`ORCH-OPS-6010`).

### Phase 2 — Persistence + State Machine (M6)

- DB migrations pass, tables match data model spec (`ORCH-DATA-2001`).
- Immutable `workflow_id` enforced across all records (`ORCH-CORE-0001`).
- State transitions enforced by DB transactions; illegal edges impossible (`ORCH-CORE-0003`).
- Idempotency key uniqueness enforced at DB level.

### Phase 3 — Vertical Slice (M7)

- Submit → lease → execute → complete workflow end-to-end with real Postgres.
- Deterministic lease ordering under concurrency (`ORCH-CORE-0004` baseline).
- Local topology validated with live workers (`ORCH-INT-4001` local).

### Phase 4 — Retries + Limits (M8)

- Lease renewal, TTL enforcement, and expired-lease reaping work correctly (`ORCH-CORE-0004` full).
- Retry policy follows deterministic rules keyed off retryable error codes.
- Per-tenant and per-task limits enforced at runtime (`ORCH-OPS-6010`).
- Chaos-concurrency test: no double-exec, no state corruption.

### Phase 5 — Plan Agent + Clarification (M9)

- Plan Agent produces deterministic DAGs without side effects (`ORCH-CORE-0002`).
- Clarification Gate blocks execution on ambiguous/high-risk intent (`ORCH-UX-8001`).
- Blocking clarification resolves correctly; default applied only per policy.

### Phase 6 — Skills + Promotion (M10)

- Skill compilation requires sandbox dry-run evidence before promotion (`ORCH-SKILL-3001`).
- Sandbox success precedes production promotion (`ORCH-OPS-6001`).
- Approval/promotion flow blocks bypass paths (`ORCH-OPS-6004`).
- Automatic rollback triggers on error rate >0.1% for 5 minutes.

### Phase 7 — mTLS + Remote (M11)

- Production worker-control-plane communication uses mTLS (`ORCH-SEC-5001`).
- Runtime readiness evidence for M11 requires transport-level gRPC mTLS. Bun compatibility fallback metadata is local-only and does not satisfy phase closure.
- Remote topology validates with live remote workers (`ORCH-INT-4001` remote).
- Runbooks and rollback procedures validated by operational drills.

### Cross-Cutting

- Every `ORCH-*` requirement has passing runtime evidence (not only spec-level checks).
- All `tests/verification/*.md` procedures implemented as executable tests.
- Secret redaction verified in runtime logging paths (`ORCH-SEC-5002` — already passing).

## Transition Criteria

The `spec-pack` profile is sufficient while implementation consists of specification documents, contracts, and validation tooling only. Transition to the `runtime-implementation` profile is required when any of these conditions are met:

- A Plan Agent, Task Execution Agent, or Scheduler component is implemented beyond type stubs.
- A gRPC or HTTP service endpoint is implemented.
- A persistence layer (database, queue) is integrated.
- Any component performs side-effecting execution in sandbox or higher environments.

## Current Status Snapshot

- `spec-pack` baseline: Ready (all executable gates passing).
- `runtime-implementation` release readiness: Pending (runtime execution coverage not yet complete).
