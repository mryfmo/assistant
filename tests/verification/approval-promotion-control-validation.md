# approval-promotion-control-validation

- Requirement: `ORCH-OPS-6004`
- Objective: prove approval and promotion control logic enforces explicit checkpoints and forbids bypass.

## Procedure

1. Run `bun run check:g6-e2e`.
2. Verify approval/promotion policy assertions execute.
3. Confirm bypass paths (direct sandbox-to-prod) are rejected.

## Pass Criteria

- Approval checkpoint rules are validated.
- No bypass rule remains enforced.
