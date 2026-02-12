# Execution Checklist

Audit sync date: 2026-02-12

## Verified in `spec-pack` (Complete)

Checks at this level validate specification consistency, contract structure, document quality, and traceability. G5/G6 checks verify schema field presence and document content assertions — not live runtime behavior. See `docs/00-norms/validation-gates.md` for scope definitions.

- [x] All requirement IDs are unique and mapped to acceptance artifacts and gate rows (`validateGateTraceability` in G0/G1/G5/G6/G7 checks).
- [x] Contract inventory and local markdown links validate cleanly (`bun run check:g0-docs`).
- [x] Step 3-6 in `docs/08-execution/execution-plan.md` are requirement-ID mapped and validated by executable check (`bun run check:g0-docs`).
- [x] Protobuf contracts pass lint and backward-compatibility checks (`bun run check:g1-contracts` with `buf lint` and `buf breaking`).
- [x] JSON schema and OpenAPI invariants are validated (`bun run check:g1-contracts`).
- [x] TypeScript lint and typecheck pass (`bun run lint:biome`, `bun run typecheck:ts`).
- [x] Spec consistency checks pass: schema field presence, document content assertions, pseudo-dispatch topology simulation, and security/logging spec validation (`bun run check:g5-integration`, `bun run check:g6-e2e`, `bun run check:g6-topology`, `bun run check:g7-security`).
- [x] `ORCH-DX-7001` (docs quality) fully satisfied by G0 gate.
- [x] `ORCH-API-1001` (contract compatibility) fully satisfied by G1 gate.
- [x] `ORCH-SEC-5002` (secret redaction) fully satisfied by runtime logging module and G7 logging gate.

## Phase 1 — Contract Service Skeletons + Runtime Scaffolding

- [x] Test runner configured (`bun test`) and `test` script added to `package.json`.
- [x] gRPC server/client stubs generated from `orchestrator.proto` and `skills.proto` (`ORCH-CORE-0010`).
- [x] Shared error envelope mapping: closed-set error codes → typed responses (`ORCH-CORE-0004`).
- [x] Config surface implemented: `ORCH_ENV`, `ORCH_DB_DSN`, `ORCH_LEASE_TTL_SECONDS`, `ORCH_MAX_RETRY`, `ORCH_REQUIRE_MTLS`, `ORCH_ARTIFACT_BACKEND` (`ORCH-OPS-6010`).
- [x] Runtime request-context interceptor scaffolding wires correlation context (`workflow_id`, `task_id`, `request_id`) and trace-aware logging hooks into gRPC-aligned handlers (`ORCH-OPS-6002`, `ORCH-OPS-6003`).
- [x] gRPC-aligned TypeScript service/message skeletons added for Plan/Worker/Artifact/Admin and client/server scaffold.
- [x] Contract-mismatch detection: version-mismatched requests rejected with `CONTRACT_MISMATCH` error.
- [x] **M5**: Service skeleton host starts and all service entrypoints reject invalid/mismatched requests deterministically.
- [x] Network-bound gRPC transport binding implemented and validated through live local gRPC calls.

## Phase 2 — Persistence Layer + Closed-Set State Machine

- Detailed execution checklist for M6-M11 (with one-row Requirement ID mapping): `checklists/runtime-implementation-m6-m11.md`.

- [x] Forward-only SQL migrations for `workflows(id, state, created_at, updated_at)`, `tasks(id, workflow_id, state, retry_count, idempotency_key)`, `leases(task_id, worker_id, expires_at)`, `artifacts(id, workflow_id, uri, digest)` (`ORCH-DATA-2001`).
- [x] Unique constraint on `(workflow_id, idempotency_key)`.
- [x] Immutable `workflow_id` enforced across all records (`ORCH-CORE-0001`).
- [x] Atomic state transition functions: `queued → leased → running → succeeded|failed|retry_wait|cancelled`, `retry_wait → queued` (`ORCH-CORE-0003`).
- [x] Illegal transitions rejected at DB level (CHECK constraints or transition functions).
- [x] Migration tests pass in local runtime test runs (`bun test`); CI currently validates spec-pack gates.
- [x] Concurrent idempotency tests pass (duplicate `idempotency_key` within same `workflow_id` rejected).
- [x] **M6**: Transitions enforced solely by DB transactions; invalid edges impossible.

## Phase 3 — Minimal Vertical Slice (Happy Path)

- [x] `PlanService.SubmitPlan` persists workflow + tasks from pre-formed plan.
- [x] Orchestrator loop moves tasks `queued → leased` with canonical ordering (priority → created_at → id).
- [x] `WorkerService.LeaseNextTask` and `ReportResult` complete tasks.
- [x] Workflow terminalization: all tasks succeeded → workflow succeeded.
- [x] `ArtifactService.RegisterArtifact` stores artifact references.
- [x] End-to-end local vertical-slice test passes (in-memory runtime path): submit → lease → report → succeeded (`ORCH-CORE-0004`, `ORCH-INT-4001` local).
- [ ] End-to-end test with real Postgres: submit → lease → report → succeeded (`ORCH-CORE-0004`, `ORCH-INT-4001` local).
- [ ] **M7**: One-command local demo reliably completes workflows with real Postgres evidence.

## Phase 4 — Lease Renewal + Retries + Limits

- [ ] `WorkerService.RenewLease` with heartbeat-based 30s TTL enforcement (`ORCH-CORE-0004`).
- [ ] Expired-lease reaper returns tasks to `queued`.
- [ ] Retry policy: max 3 retries, `retry_wait → queued` with backoff, keyed off retryable error codes (`LEASE_CONFLICT`, `DEPENDENCY_FAILURE`, `TASK_TIMEOUT`).
- [ ] Non-retryable errors (`INVALID_REQUEST`, `FORBIDDEN`, `POLICY_DENIED`) immediately terminate tasks.
- [ ] Execution timeout enforcement: 300s per task, 60s for plan stage.
- [ ] Per-tenant active-workflow cap: 200 (`ORCH-OPS-6010`).
- [ ] Task payload size cap: 512KB.
- [ ] Load shedding on queue depth threshold.
- [ ] Chaos-concurrency tests: multiple workers, no double-exec, no state corruption.
- [ ] **M8**: Chaos test passes cleanly.

## Phase 5 — Plan Agent + Clarification Gate

- [ ] Plan Agent generates deterministic DAG from user intent: nodes (plan/clarification/task/approval), edges (`ORCH-CORE-0002`).
- [ ] Plan Agent has no side-effect capability tokens; side-effect prohibition enforced.
- [ ] Clarification Gate detects ambiguous/high-risk intent (`ORCH-UX-8001`).
- [ ] Blocking question emitted: question, reason, options (max 4), recommended_default, consequence_if_selected. One question at a time.
- [ ] Execution halted until clarification resolved; default applied only when policy allows.
- [ ] `AdminService.CancelWorkflow` implementation.
- [ ] DAG determinism golden tests pass.
- [ ] Clarification blocking integration tests pass.
- [ ] **M9**: Ambiguous intent blocks with well-formed question; resumes correctly after resolution.

## Phase 6 — Skill Compiler + Promotion Controller

- [ ] Skill manifest validated against `skill-manifest.v1.json` (`ORCH-SKILL-3001`).
- [ ] Permission policy enforcement: reject malformed/unsigned artifacts in non-sandbox.
- [ ] Sandbox execution mode captures dry-run evidence as artifacts.
- [ ] Promotion workflow: sandbox → staging → prod. Direct sandbox→prod forbidden (`ORCH-OPS-6001`).
- [ ] Explicit approval gate before each promotion stage (`ORCH-OPS-6004`).
- [ ] Automatic rollback if error rate >0.1% for 5 minutes.
- [ ] Policy-deny tests pass (FORBIDDEN/POLICY_DENIED).
- [ ] Dry-run-required tests pass.
- [ ] Rollback threshold tests pass.
- [ ] **M10**: Skill cannot reach prod without sandbox evidence + explicit approval.

## Phase 7 — mTLS + Remote Topology Hardening

- [ ] mTLS wiring in gRPC server/client with short-lived certificate plumbing (`ORCH-SEC-5001`).
- [ ] `ORCH_REQUIRE_MTLS`: optional in sandbox, required in staging/prod.
- [ ] Identity → tenant mapping for limits and audit.
- [ ] Remote worker connectivity via `grpcs://` endpoints (`ORCH-INT-4001` remote).
- [ ] Certificate rotation runbook validated.
- [ ] mTLS on/off matrix integration tests pass.
- [ ] Unauthorized/forbidden rejection tests pass.
- [ ] Remote worker end-to-end test passes.
- [ ] **M11**: staging/prod refuse non-mTLS; remote worker completes workflows.

## Cross-Cutting (All Phases)

- [ ] Optional Python/Rust gates exercised when those components are introduced (G3/G4).
- [ ] All `ORCH-*` requirements have passing runtime evidence (not only spec-level checks).
- [ ] All `tests/verification/*.md` procedures are implemented as executable tests.

## Notes

- This checklist tracks execution status, not only document intent.
- Phase dependency graph: P1 → P2 → P3 → P4 → P6 → P7, P3 → P5 → P6. P4 and P5 can parallelize.
- Runtime-deployment readiness is blocked until all phase items above are executable and passing.
- Transition criteria from spec-pack to runtime-implementation are defined in `.agent/CompletionCriteria.md`.
