# Implementation Order

1. Finalize requirements and contracts.
2. Implement contract validation pipeline.
3. Implement orchestrator state machine (`ORCH-CORE-0003`).
4. Implement worker leasing and retries (`ORCH-CORE-0004`).
5. Implement skill compilation and sandbox dry-run (`ORCH-SKILL-3001`).
6. Implement approval and promotion control (`ORCH-OPS-6004`).
7. Execute acceptance matrix with `check:g0-docs`, `check:g1-contracts`, `check:g5-integration`, `check:g6-e2e`, `check:g6-topology`, and `check:g7-security`, then harden operations.

# Milestone Acceptance

- M1: Contract gates pass.
- M2: Local orchestration pass (`ORCH-INT-4001`).
- M3: Remote orchestration pass (`ORCH-INT-4001`).
- M4: Sandbox-to-prod promotion policy pass.

# Requirement Mapping

All milestones map to `docs/06-acceptance/requirements.yaml` IDs.
