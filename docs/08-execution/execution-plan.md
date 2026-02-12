# Implementation Order

Steps 1-2 are complete (spec-pack profile). Steps 3-7 correspond to the runtime-implementation phases defined in `.agent/ExecPlan.md`.

1. Finalize requirements and contracts. (Done — spec-pack)
2. Implement contract validation pipeline. (Done — spec-pack)
3. Implement orchestrator state machine (`ORCH-CORE-0003`). → Phase 2.
4. Implement worker leasing and retries (`ORCH-CORE-0004`). → Phases 3-4.
5. Implement skill compilation and sandbox dry-run (`ORCH-SKILL-3001`). → Phase 6.
6. Implement approval and promotion control (`ORCH-OPS-6004`). → Phase 6.
7. Execute acceptance matrix with `check:g0-docs`, `check:g1-contracts`, `check:g5-integration`, `check:g6-e2e`, `check:g6-topology`, and `check:g7-security`, then harden operations. → Phase 7.

# Milestone Acceptance

spec-pack milestones (M1-M4) are complete. Runtime-implementation milestones (M5-M11) are defined in `.agent/ExecPlan.md`.

- M1: Contract gates pass. (Done)
- M2: Local orchestration pass (`ORCH-INT-4001`). (Done — spec-level pseudo-dispatch)
- M3: Remote orchestration pass (`ORCH-INT-4001`). (Done — spec-level pseudo-dispatch)
- M4: Sandbox-to-prod promotion policy pass. (Done — spec-level policy validation)
- M5-M11: Runtime-implementation milestones. See `.agent/ExecPlan.md` for full definitions.

# Requirement Mapping

All milestones map to `docs/06-acceptance/requirements.yaml` IDs. The detailed per-phase requirement mapping is maintained in `.agent/ExecPlan.md`.
