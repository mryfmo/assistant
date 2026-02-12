# Runtime Implementation Checklist (M6-M11)

Canonical requirement source: `docs/06-acceptance/requirements.yaml`.
Canonical completion criteria: `.agent/CompletionCriteria.md`.
This checklist is execution-focused and keeps a one-row-to-one-requirement mapping.

## Usage Rules

- Complete items in milestone order (M6 -> M11) unless dependencies are explicitly cleared.
- Each row maps to exactly one `Requirement ID`.
- Do not mark an item complete until required tests pass and evidence is updated.
- After each milestone, update `docs/06-acceptance/acceptance-matrix.md` with evidence links.

## Runtime Status Snapshot (Canonical Alignment)

Status levels are defined in `.agent/CompletionCriteria.md`.

| Milestone | Current Status | Notes |
|---|---|---|
| M5 | `phase-closed` | Runtime service skeleton and network gRPC host are complete. |
| M6 | `phase-closed` | Persistence/state machine/idempotency constraints are complete for current runtime profile. |
| M7 | `phase-closed` | Real Postgres vertical-slice runtime evidence executed and linked. |
| M8 | `phase-closed` | Postgres contention runtime evidence (renewal/reaper/retry/chaos) executed and linked. |
| M9 | `phase-closed` | Submit-path clarification/plan integration runtime evidence executed and linked. |
| M10 | `phase-closed` | Promotion/approval/rollback runtime-path evidence executed and linked. |
| M11 | `phase-closed` | Transport-level mTLS evidence executed with fallback disabled and linked. |

Row-level `[x]` markers in this checklist indicate runtime closure evidence is linked and executable.

## M6 - Persistence Layer and Closed-Set State Machine

| Status | Milestone | Requirement ID | Work Item | Target Files (create/update) | Required Tests | Done When |
|---|---|---|---|---|---|---|
| [x] | M6 | ORCH-DATA-2001 | Add forward-only relational schema for workflows, tasks, leases, artifacts. | `db/migrations/0001_init_workflows_tasks_leases_artifacts.sql` | `tests/runtime/persistence-migrations.test.ts` | Migration applies cleanly on empty DB and preserves forward-only policy. |
| [x] | M6 | ORCH-CORE-0001 | Enforce immutable `workflow_id` across persisted records and references. | `db/migrations/0002_workflow_id_immutability.sql`, `src/core/persistence/workflow-repository.ts`, `src/core/persistence/task-repository.ts`, `src/core/persistence/artifact-repository.ts` | `tests/runtime/workflow-id-immutability.test.ts` | Any update attempt that changes `workflow_id` is rejected deterministically. |
| [x] | M6 | ORCH-DATA-2001 | Add idempotency uniqueness per workflow. | `db/migrations/0003_workflow_id_idempotency_unique.sql`, `src/core/persistence/task-repository.ts` | `tests/runtime/idempotency-concurrency.test.ts` | Duplicate `(workflow_id, idempotency_key)` is rejected under concurrent insert attempts. |
| [x] | M6 | ORCH-CORE-0003 | Implement closed-set task transition policy in domain logic. | `src/core/domain/state-machine.ts` | `tests/runtime/state-machine-transitions.test.ts` | Only legal edges are accepted; all illegal edges return deterministic errors. |
| [x] | M6 | ORCH-DATA-2001 | Enforce atomic transition writes inside DB transactions. | `src/core/persistence/db.ts`, `src/core/persistence/task-repository.ts` | `tests/runtime/atomic-transition.test.ts` | No partial state writes are observable when failures are injected. |
| [x] | M6 | ORCH-CORE-0003 | Add DB-side rejection for illegal transitions (constraint/function trigger). | `db/migrations/0004_transition_constraints.sql` | `tests/runtime/state-machine-db-constraints.test.ts` | Illegal transitions are impossible even if application checks are bypassed. |

## M7 - Minimal Vertical Slice (Local)

> Scope note: M7 rows in this checklist validate local vertical-slice behavior. Real Postgres validated-runtime evidence for full phase closure is tracked in `.agent/Checklist.md` and `.agent/ExecPlan.md`.

| Status | Milestone | Requirement ID | Work Item | Target Files (create/update) | Required Tests | Done When |
|---|---|---|---|---|---|---|
| [x] | M7 | ORCH-CORE-0004 | Implement `SubmitPlan` persistence path (workflow + tasks). | `src/core/orchestrator/submit-plan.ts`, `src/core/runtime/grpc/server.ts` | `tests/runtime/submit-plan.integration.test.ts` | `SubmitPlan` stores workflow/tasks deterministically with typed errors. |
| [x] | M7 | ORCH-CORE-0004 | Implement deterministic leasing order and lease issuance. | `src/core/orchestrator/lease-next-task.ts`, `src/core/persistence/lease-repository.ts` | `tests/runtime/lease-ordering.integration.test.ts` | Lease order follows `priority -> created_at -> id` with no ambiguity. |
| [x] | M7 | ORCH-CORE-0004 | Implement `ReportResult` completion and retry-state handoff integration point. | `src/core/orchestrator/report-result.ts`, `src/core/runtime/grpc/server.ts` | `tests/runtime/report-result.integration.test.ts` | Task outcomes persist correctly and emit deterministic task terminal/non-terminal state. |
| [x] | M7 | ORCH-INT-4001 | Wire local orchestrator/worker path through runtime services. | `src/core/orchestrator/index.ts`, `src/core/runtime/grpc/server.ts` | `tests/runtime/vertical-slice-local.e2e.test.ts` | Local flow `submit -> lease -> report -> workflow terminal` passes end-to-end. |
| [x] | M7 | ORCH-INT-4001 | Add real Postgres E2E runtime evidence path for vertical slice. | `tests/runtime/postgres-fixture.ts`, `tests/runtime/vertical-slice-postgres.e2e.test.ts` | `tests/runtime/vertical-slice-postgres.e2e.test.ts` | Postgres-backed `submit -> lease -> report -> workflow terminal` evidence is executable when `ORCH_TEST_POSTGRES_DSN` is set. |
| [x] | M7 | ORCH-CORE-0001 | Persist artifact references with immutable workflow linkage. | `src/core/orchestrator/register-artifact.ts`, `src/core/persistence/artifact-repository.ts` | `tests/runtime/artifact-registration.integration.test.ts` | Artifacts are stored and always trace back to immutable `workflow_id`. |

## M8 - Lease Renewal, Retry, Timeouts, Runtime Limits

| Status | Milestone | Requirement ID | Work Item | Target Files (create/update) | Required Tests | Done When |
|---|---|---|---|---|---|---|
| [x] | M8 | ORCH-CORE-0004 | Implement lease heartbeat renewal (`RenewLease`) and TTL checks. | `src/core/orchestrator/renew-lease.ts`, `src/core/runtime/grpc/server.ts` | `tests/runtime/lease-renewal.test.ts` | Valid renewals extend TTL; invalid renewals are rejected deterministically. |
| [x] | M8 | ORCH-CORE-0004 | Implement expired-lease reaper returning tasks to queue. | `src/core/orchestrator/lease-reaper.ts`, `src/core/persistence/lease-repository.ts` | `tests/runtime/lease-reaper.test.ts` | Expired leases are reclaimed without duplicate execution. |
| [x] | M8 | ORCH-CORE-0004 | Implement retry policy tied to retryable error codes and capped attempts. | `src/core/orchestrator/retry-policy.ts`, `src/core/contracts/error-envelope.ts` | `tests/runtime/retry-policy.test.ts` | Retryability decisions match closed-set error-code policy exactly. |
| [x] | M8 | ORCH-OPS-6010 | Enforce plan/task timeout limits with configured units. | `src/core/orchestrator/timeout-enforcer.ts`, `src/core/runtime/config.ts` | `tests/runtime/timeout-enforcement.test.ts` | Plan timeout (60s) and task timeout (300s) enforce correctly via config. |
| [x] | M8 | ORCH-OPS-6010 | Enforce tenant concurrency and payload-size limits with load shedding. | `src/core/orchestrator/runtime-limits.ts`, `src/core/runtime/config.ts` | `tests/runtime/runtime-limits.test.ts` | Tenant cap and payload cap are enforced and overloaded requests are shed. |
| [x] | M8 | ORCH-CORE-0004 | Validate concurrency safety under multi-worker contention. | `tests/runtime/chaos-concurrency.test.ts` | `tests/runtime/chaos-concurrency.test.ts` | No double-execution or state corruption under concurrent leasing/reporting. |
| [x] | M8 | ORCH-CORE-0004 | Add real Postgres contention evidence for renewal/reaper/retry/chaos behavior. | `tests/runtime/postgres-fixture.ts`, `tests/runtime/chaos-concurrency-postgres.e2e.test.ts` | `tests/runtime/chaos-concurrency-postgres.e2e.test.ts` | DB-level contention validates no double-exec and no state corruption under lease/retry/reaper paths. |

## M9 - Plan Agent and Clarification Gate

| Status | Milestone | Requirement ID | Work Item | Target Files (create/update) | Required Tests | Done When |
|---|---|---|---|---|---|---|
| [x] | M9 | ORCH-CORE-0002 | Implement deterministic Plan Agent DAG generation without execution side effects. | `src/core/planning/plan-agent.ts`, `src/core/planning/dag-determinism.ts` | `tests/runtime/plan-agent-no-side-effects.test.ts`, `tests/runtime/dag-determinism-golden.test.ts` | Plan generation is deterministic and no side-effect capability is invoked. |
| [x] | M9 | ORCH-UX-8001 | Implement clarification gate with one-question blocking policy. | `src/core/clarification/clarification-gate.ts`, `src/core/clarification/question-format.ts`, `src/core/orchestrator/submit-plan.ts` | `tests/runtime/clarification-gate-blocking.e2e.test.ts`, `tests/runtime/submit-path-clarification-plan.integration.test.ts` | Ambiguous/high-risk intent blocks execution and emits valid question payload in submit path. |
| [x] | M9 | ORCH-UX-8001 | Implement clarification resolution and safe resume semantics. | `src/core/clarification/clarification-gate.ts`, `src/core/orchestrator/index.ts` | `tests/runtime/clarification-resume.e2e.test.ts` | Workflow resumes only after resolution and follows selected/default policy rules. |
| [x] | M9 | ORCH-CORE-0002 | Implement `AdminService.CancelWorkflow` with deterministic cancellation behavior. | `src/core/orchestrator/cancel-workflow.ts`, `src/core/runtime/grpc/server.ts` | `tests/runtime/cancel-workflow.integration.test.ts` | Cancellation transitions are valid, idempotent, and side-effect-safe. |

## M10 - Skill Compiler and Promotion Controller

| Status | Milestone | Requirement ID | Work Item | Target Files (create/update) | Required Tests | Done When |
|---|---|---|---|---|---|---|
| [x] | M10 | ORCH-SKILL-3001 | Validate skill manifests against schema and permission policy. | `src/core/skills/skill-manifest-validator.ts`, `contracts/jsonschema/skill-manifest.v1.json` | `tests/runtime/skill-manifest-validation.test.ts` | Malformed/invalid manifests are rejected deterministically. |
| [x] | M10 | ORCH-SKILL-3001 | Require sandbox dry-run evidence artifacts before promotion eligibility. | `src/core/skills/sandbox-dryrun.ts`, `src/core/orchestrator/register-artifact.ts` | `tests/runtime/sandbox-dryrun-required.test.ts` | Promotion-eligible state is unreachable without valid dry-run evidence. |
| [x] | M10 | ORCH-OPS-6001 | Implement promotion state progression `sandbox -> staging -> prod` only. | `src/core/promotion/promotion-controller.ts` | `tests/runtime/promotion-path-policy.test.ts` | Direct `sandbox -> prod` is impossible and rejected with policy error. |
| [x] | M10 | ORCH-OPS-6004 | Implement explicit approval gates for each promotion boundary. | `src/core/promotion/approval-gate.ts`, `src/core/promotion/promotion-controller.ts` | `tests/runtime/promotion-approval-required.test.ts` | Promotion proceeds only with explicit recorded approvals. |
| [x] | M10 | ORCH-OPS-6004 | Enforce non-bypass control and deny-path behavior. | `src/core/promotion/promotion-controller.ts` | `tests/runtime/promotion-bypass-denied.test.ts` | Any bypass attempt fails with deterministic denial and audit trail. |
| [x] | M10 | ORCH-OPS-6001 | Implement automatic rollback threshold policy. | `src/core/promotion/rollback-policy.ts`, `src/core/promotion/promotion-controller.ts` | `tests/runtime/rollback-threshold.test.ts`, `tests/runtime/promotion-runtime-rollback.integration.test.ts` | Rollback triggers when error rate exceeds policy threshold and duration. |

## M11 - mTLS Enforcement and Remote Topology Hardening

| Status | Milestone | Requirement ID | Work Item | Target Files (create/update) | Required Tests | Done When |
|---|---|---|---|---|---|---|
| [x] | M11 | ORCH-SEC-5001 | Implement gRPC mTLS server/client credential wiring. | `src/core/runtime/grpc/tls-config.ts`, `src/core/runtime/grpc/network-server.ts`, `src/core/runtime/grpc/client.ts` | `tests/runtime/mtls-enforcement.integration.test.ts` | Staging/prod reject non-mTLS connections and accept valid mTLS peers only. |
| [x] | M11 | ORCH-SEC-5001 | Add transport-level mTLS evidence path independent from metadata fallback. | `src/core/runtime/config.ts`, `src/core/runtime/grpc/tls-config.ts`, `tests/runtime/mtls-transport-level.integration.test.ts` | `tests/runtime/mtls-transport-level.integration.test.ts` | Transport-level handshake rejection/acceptance is executable with metadata fallback disabled. |
| [x] | M11 | ORCH-SEC-5001 | Enforce environment policy (`sandbox` optional, `staging/prod` required). | `src/core/runtime/config.ts`, `src/core/runtime/grpc/tls-config.ts` | `tests/runtime/mtls-matrix.integration.test.ts` | mTLS requirement matrix matches policy in all environments. |
| [x] | M11 | ORCH-INT-4001 | Validate remote worker connectivity and execution over `grpcs://`. | `src/core/orchestrator/index.ts`, `src/core/runtime/grpc/network-server.ts` | `tests/runtime/remote-worker.e2e.test.ts` | Remote topology completes workflows without semantic drift from local mode. |
| [x] | M11 | ORCH-INT-4001 | Validate unauthorized/forbidden remote execution rejection paths. | `src/core/security/worker-identity.ts`, `src/core/runtime/grpc/server.ts` | `tests/runtime/unauthorized-forbidden-rejection.test.ts` | Unauthorized and forbidden requests are rejected with correct error semantics. |
| [x] | M11 | ORCH-SEC-5001 | Document and verify certificate rotation operations. | `docs/04-ops/certificate-rotation-runbook.md` | `tests/verification/mtls-enforcement-test.md` (evidence link update) | Rotation runbook is present, reviewable, and linked in acceptance evidence. |

## Milestone Exit Gates (Run at End of Each Milestone)

| Status | Milestone | Requirement ID | Work Item | Command | Done When |
|---|---|---|---|---|---|
| [x] | M6-M11 | ORCH-API-1001 | Contract compatibility gate | `bun run check:g1-contracts` | Command exits 0 and no compatibility regressions are reported. |
| [x] | M6-M11 | ORCH-DX-7001 | Documentation and traceability gate | `bun run check:g0-docs` | Command exits 0 and requirement traceability remains intact. |
| [x] | M6-M11 | ORCH-CORE-0010 | Versioned boundary consistency gate | `bun run check:g5-integration` | Command exits 0 and versioned contract boundaries remain valid. |
| [x] | M6-M11 | ORCH-INT-4001 | Requirement and topology consistency gates | `bun run check:g6-e2e && bun run check:g6-topology` | Both commands exit 0 and topology assertions remain valid. |
| [x] | M6-M11 | ORCH-SEC-5002 | Security/logging gate | `bun run check:g7-security` | Command exits 0 and redaction/correlation assertions remain valid. |
| [x] | M6-M11 | ORCH-CORE-0010 | Type and lint quality gate | `bun run lint:biome && bun run typecheck:ts` | Both commands exit 0 with no type/lint regressions. |

> Last verified (local run): 2026-02-12 (`check:g0-docs`, `check:g1-contracts`, `lint:biome`, `typecheck:ts`, `check:g5-integration`, `check:g6-e2e`, `check:g6-topology`, `check:g7-security`, `bun test`).
