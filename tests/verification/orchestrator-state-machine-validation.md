# orchestrator-state-machine-validation

- Requirement: `ORCH-CORE-0003`
- Objective: prove state-machine constraints are explicitly defined and executable checks enforce required transitions.

## Procedure

1. Run `bun run check:g6-e2e`.
2. Verify state-machine transition requirements are checked.
3. Confirm illegal transition rejection requirement is present.

## Pass Criteria

- Closed-set transition edges are validated.
- Illegal transition rejection requirement remains enforced.
