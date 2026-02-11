# Implementation Order

1. Finalize requirements and contracts.
2. Implement contract validation pipeline.
3. Implement orchestrator state machine.
4. Implement worker leasing and retries.
5. Implement skill compilation and sandbox dry-run.
6. Implement approval and promotion control.
7. Execute acceptance matrix with `check:g5-integration`, `check:g6-e2e`, and `check:g7-security`, then harden operations.

# Milestone Acceptance

- M1: Contract gates pass.
- M2: Local orchestration pass.
- M3: Remote orchestration pass.
- M4: Sandbox-to-prod promotion policy pass.

# Requirement Mapping

All milestones map to `docs/06-acceptance/requirements.yaml` IDs.
