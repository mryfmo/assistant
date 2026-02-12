# Distributed Orchestration Implementation Plan

This is a living plan. Update `Progress`, `Decision Log`, and `Outcomes` as work advances.

## Purpose

Implement a production-grade orchestration platform where non-technical users can request skill creation and execution through OpenWork, with Plan Agent x1 and Task Execution Agents xN across local and remote workers.

## Progress — spec-pack (Complete)

- [x] Initialize repository structure and baseline governance docs.
- [x] Define contract-first document tree and acceptance matrix scaffolding.
- [x] Implement executable contract validation automation (`bun run check:g1-contracts`) with `buf lint` and `buf breaking`.
- [x] Implement executable docs validation (`bun run check:g0-docs`) including link/inventory checks and execution-plan step 3-6 requirement mapping.
- [x] Implement spec-consistency validation commands (`check:g5-integration`, `check:g6-e2e`, `check:g6-topology`, `check:g7-security`) — these validate schema structure, document content assertions, and pseudo-dispatch topology simulation at the spec-pack level.
- [x] Add topology pseudo-dispatch validation for local/remote execution (`ORCH-INT-4001`) — validates Plan Agent x1 / Task Execution Agents xN constraints using simulated topology objects and runtime logging module, not live dispatch.

## Progress — runtime-implementation (Active)

- [x] **Phase 1 bootstrap started**: test runner script added, runtime config loader added, closed-set error envelope mapping added, and gRPC-aligned TypeScript service skeletons/interceptors added.
- [x] **Phase 1**: Contract service skeletons and runtime scaffolding (generated stubs + network-bound gRPC transport binding complete; M5 closed).
- [x] **Phase 2**: Persistence layer and closed-set state machine.
- [x] **Phase 3**: implemented-local (happy-path orchestration complete in local/in-memory runtime); validated-runtime evidence pending (real Postgres).
- [x] **Phase 4**: implemented-local (renewal/retry/timeout/limits/chaos tests present in local runtime); phase-closed pending validated-runtime evidence.
- [x] **Phase 5**: implemented-local (Plan Agent, clarification blocking/resume, cancel workflow implemented and tested locally); phase-closed pending validated-runtime evidence.
- [x] **Phase 6**: implemented-local (skill manifest, dry-run evidence, promotion path/approval/rollback logic implemented and tested locally); phase-closed pending validated-runtime evidence.
- [x] **Phase 7**: implemented-local (mTLS wiring and remote topology paths implemented and tested locally); phase-closed pending validated-runtime evidence.

## Milestones

| # | Milestone | Profile | Status |
|---|-----------|---------|--------|
| M1 | Documentation and contract pack complete | spec-pack | Done |
| M2 | Contract validation and CI gates complete | spec-pack | Done |
| M3 | Local topology pseudo-dispatch simulation complete | spec-pack | Done |
| M4 | Remote topology pseudo-dispatch simulation complete | spec-pack | Done |
| M5 | Services start, reject invalid/mismatched requests deterministically | runtime P1 | Done (in-process service host + network-bound gRPC transport) |
| M6 | State transitions enforced by DB transactions; invalid edges impossible | runtime P2 | Done |
| M7 | One-command local demo completes workflows end-to-end | runtime P3 | Implemented-local (real Postgres validated-runtime evidence pending) |
| M8 | Chaos-concurrency test: no double-exec, no state corruption | runtime P4 | Implemented-local (validated-runtime evidence pending) |
| M9 | Ambiguous intent blocks with well-formed question; resumes correctly | runtime P5 | Implemented-local (validated-runtime evidence pending) |
| M10 | Skill cannot reach prod without sandbox evidence + explicit approval | runtime P6 | Implemented-local (validated-runtime evidence pending) |
| M11 | staging/prod refuse non-mTLS; remote worker completes workflows | runtime P7 | Implemented-local (validated-runtime evidence pending) |

## Phase Details

### Phase 1 — Contract Service Skeletons + Runtime Scaffolding

**Deliverables:**
- Test runner configured (`bun test` or `vitest`); `test` script in `package.json`.
- gRPC server/client stubs generated from `orchestrator.proto` and `skills.proto`.
- Shared error envelope mapping (closed-set error codes → typed responses).
- Config surface for runtime limits (`ORCH_ENV`, `ORCH_DB_DSN`, `ORCH_LEASE_TTL_SECONDS`, `ORCH_MAX_RETRY`, `ORCH_REQUIRE_MTLS`, `ORCH_ARTIFACT_BACKEND`).
- Logging/correlation/trace wired into gRPC interceptors (reuses existing logging module).

**Requirements satisfied:** `ORCH-CORE-0010`, `ORCH-OPS-6002`, `ORCH-OPS-6003`, `ORCH-OPS-6010`

**Dependencies:** None (builds on existing spec-pack).

**Tests:** Protobuf compile tests, contract-mismatch unit tests, interceptor correlation tests, config validation tests.

**Milestone (M5):** All gRPC services start and deterministically reject invalid or version-mismatched requests.

### Phase 2 — Persistence Layer + Closed-Set State Machine

**Deliverables:**
- Forward-only SQL migrations for `workflows`, `tasks`, `leases`, `artifacts` tables.
- Unique constraint on `(workflow_id, idempotency_key)`.
- Atomic state transition functions enforced by DB transactions.
- State machine: `queued → leased → running → succeeded|failed|retry_wait|cancelled`, `retry_wait → queued`.
- Illegal transitions rejected at the DB level (CHECK constraints or transition functions).

**Requirements satisfied:** `ORCH-CORE-0001`, `ORCH-CORE-0003`, `ORCH-DATA-2001`

**Dependencies:** Phase 1 (config surface for DB DSN).

**Tests:** Migration tests, state transition unit/property tests, concurrent idempotency tests, illegal-transition rejection tests.

**Milestone (M6):** State transitions enforced solely by DB transactions; invalid edges are impossible.

### Phase 3 — Minimal Vertical Slice (Happy Path)

**Deliverables:**
- `PlanService.SubmitPlan` persists workflow + tasks (pre-formed plan, no Plan Agent yet).
- Orchestrator loop moves tasks `queued → leased`.
- `WorkerService.LeaseNextTask` and `ReportResult` complete tasks.
- Workflow terminalization logic (all tasks succeeded → workflow succeeded).
- `ArtifactService.RegisterArtifact` stores artifact references.
- Canonical lease ordering: priority → created_at → id.

**Requirements satisfied:** `ORCH-CORE-0004` (baseline), `ORCH-INT-4001` (local topology)

**Dependencies:** Phase 2 (persistence + state machine).

**Tests:** Local end-to-end test (in-memory runtime path): submit plan → worker leases → reports success → workflow succeeded. Artifact registration test. Real Postgres end-to-end evidence remains pending.

**Milestone (M7):** One-command local demo reliably completes workflows. Real Postgres evidence remains required before full Phase 3 closure.

### Phase 4 — Lease Renewal + Retries + Limits

**Deliverables:**
- `WorkerService.RenewLease` with heartbeat-based 30s TTL enforcement.
- Expired-lease reaper (returns tasks to `queued`).
- Retry policy: max 3, `retry_wait → queued` with backoff, keyed off retryable error codes (`LEASE_CONFLICT`, `DEPENDENCY_FAILURE`, `TASK_TIMEOUT`).
- Execution timeout enforcement (300s per task, 60s for plan stage).
- Per-tenant active-workflow cap (200) and payload-size cap (512KB).
- Load shedding on queue depth threshold.

**Requirements satisfied:** `ORCH-CORE-0004` (full), `ORCH-OPS-6010`

**Dependencies:** Phase 3.

**Tests:** Lease conflict deterministic tests, clock-skew/TTL expiry tests, retry backoff tests, limit enforcement tests, chaos-concurrency test (many workers).

**Milestone (M8):** Chaos-style concurrency test runs with no double-exec beyond at-least-once and no state corruption.

### Phase 5 — Plan Agent + Clarification Gate

**Deliverables:**
- Plan Agent: generates deterministic DAG from user intent (nodes with kinds: plan/clarification/task/approval, edges). No side-effect capability tokens.
- Clarification Gate: detects ambiguous/high-risk intent, emits blocking question (question, reason, options max 4, recommended_default, consequence_if_selected). One question at a time. Execution halted until resolved.
- `AdminService.CancelWorkflow` implementation.

**Requirements satisfied:** `ORCH-CORE-0002`, `ORCH-UX-8001`

**Dependencies:** Phase 3 (SubmitPlan exists). Can run in parallel with Phase 4.

**Tests:** DAG determinism golden tests, side-effect prohibition tests (capability tokens absent during planning), clarification blocking integration tests, cancel workflow tests.

**Milestone (M9):** Ambiguous/high-risk intents consistently block with a single well-formed question and resume correctly after resolution.

### Phase 6 — Skill Compiler + Promotion Controller

**Deliverables:**
- Skill manifest validation against `skill-manifest.v1.json`.
- Permission policy enforcement (reject malformed/unsigned artifacts in non-sandbox).
- Sandbox execution mode capturing dry-run evidence as artifacts.
- Promotion workflow: sandbox → staging → prod. Direct sandbox→prod forbidden.
- Explicit approval gate before each promotion stage.
- Automatic rollback if error rate >0.1% for 5 minutes.

**Requirements satisfied:** `ORCH-SKILL-3001`, `ORCH-OPS-6001`, `ORCH-OPS-6004`

**Dependencies:** Phase 4 (retries/metrics basis) + Phase 3 (artifact service).

**Tests:** Policy-deny tests (FORBIDDEN/POLICY_DENIED), dry-run-required tests, promotion state-machine tests, rollback threshold tests.

**Milestone (M10):** A skill cannot reach prod without a recorded sandbox run + explicit approval, and rollback triggers correctly under injected failures.

### Phase 7 — mTLS + Remote Topology Hardening

**Deliverables:**
- mTLS wiring in gRPC server/client with short-lived certificate plumbing.
- `ORCH_REQUIRE_MTLS` behavior: optional in sandbox, required in staging/prod.
- Identity → tenant mapping for limits and audit.
- Remote worker connectivity: `grpcs://` endpoint validation.
- Certificate rotation runbook validation.

**Requirements satisfied:** `ORCH-SEC-5001`, `ORCH-INT-4001` (remote topology)

**Dependencies:** Phases 1–6.

**Tests:** mTLS on/off matrix integration tests, unauthorized/forbidden rejection tests, cert-rotation/expiry tests, remote worker end-to-end test.

**Milestone (M11):** staging/prod refuse non-mTLS clients, sandbox runs without mTLS, remote worker completes workflows end-to-end.

## Dependency Graph

```
P1 → P2 → P3 → P4 → P6 → P7
                ↘         ↗
                 P5 → P6
```

- P4 and P5 can run in parallel once P3 is complete.
- P6 requires both P4 and P5.
- P7 requires all prior phases.

## Decision Log

- Decision: Contract-first architecture with protobuf + JSON Schema dual contracts.
  - Rationale: Reduces ambiguity across TypeScript, Python, and Rust implementations.

- Decision: Clarification gate before execution for non-technical UX safety.
  - Rationale: Prevents ambiguous or dangerous side effects.

- Decision: Validation gates are executable commands, not artifact-presence checks.
  - Rationale: Prevents false green CI from passive file existence checks.

- Decision: Execution plan steps 3-6 MUST reference requirement IDs in the plan itself.
  - Rationale: Keeps implementation order directly traceable to acceptance requirements.

- Decision: Local/remote completion in spec-pack is validated through deterministic pseudo-dispatch (`check:g6-topology`).
  - Rationale: Provides objective topology evidence before full runtime deployment implementation.

- Decision: 7-phase implementation order for runtime-implementation profile, front-loading highest-risk constraints (transactional leasing, idempotency, state machine atomicity).
  - Rationale: Proves architecture correctness with minimal vertical slice before layering agent intelligence and promotion controls. See Oracle consultation 2026-02-12.

## Risk Register

| Risk | Mitigation | Phase |
|------|-----------|-------|
| Lease renewal races under concurrency | Enforce owner + expiry checks transactionally in DB, not in memory | P4 |
| Non-deterministic task ordering | Define canonical ordering (priority → created_at → id), test under concurrency | P3 |
| Tenant identity source ambiguity | Pick single authoritative source early (mTLS identity or request auth), persist for limits/audit | P1 |
| Forward-only migration correctness | Migration tests in CI, destructive migrations require explicit maintenance window | P2 |
| gRPC contract versioning drift | buf breaking checks in CI (already in place), CONTRACT_MISMATCH error code at runtime | P1 |

## Validation

- Validation gates are defined in `docs/00-norms/validation-gates.md`.
- spec-pack completion requires all spec-pack gates to pass.
- runtime-implementation completion requires all G0-G7 gates at runtime depth plus per-phase milestone evidence.

## Outcomes and Retrospective

- 2026-02-12: G0/G1 executable hardening, step 3-6 requirement mapping, topology pseudo-validation, and remaining requirement traceability additions were merged in PR #4.
- 2026-02-12: Spec-pack gate suite passes locally (all spec-consistency and document-level checks). G5/G6 checks validate schema structure and document content assertions, not live runtime behavior. G7 logging check is the only gate that exercises actual TypeScript runtime code.
- 2026-02-12: Governance audit identified and corrected: lint:biome formatting gap, dual CompletionCriteria ambiguity, gate scope naming accuracy, testing-strategy coverage scope, and pseudo-dispatch scope clarification.
- 2026-02-12: Runtime-implementation plan created with 7 phases, 7 milestones (M5-M11), dependency graph, and risk register. Oracle-consulted sequencing front-loads highest-risk correctness constraints.
- 2026-02-12: P1 started with executable scaffolding: `test` script + runtime unit tests, `RuntimeConfig` loader, closed-set error envelope module, gRPC-aligned TypeScript service skeletons, and request-context logging interceptor wrappers.
- 2026-02-12: M5 reached for service skeleton scope: in-process runtime service host starts and deterministically rejects invalid requests (`INVALID_REQUEST`) and contract-major mismatches (`CONTRACT_MISMATCH`) across Plan/Worker/Artifact/Admin entrypoints.
- 2026-02-12: P1 closed: protobuf generated stubs added under `src/generated/proto`, and live network-bound gRPC transport binding validated via local unary calls with deterministic invalid/mismatch rejection.
