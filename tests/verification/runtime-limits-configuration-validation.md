# runtime-limits-configuration-validation

- Requirement: `ORCH-OPS-6010`
- Objective: prove runtime limits remain centrally configurable with numeric values and explicit units.

## Procedure

1. Run `bun run check:g6-e2e`.
2. Verify performance limits document includes numeric hard limits and timeout units.
3. Verify central configurability requirement remains explicitly stated.

## Pass Criteria

- E2E validation exits with status code `0`.
- Runtime limits retain numeric values and unit-bearing timeout definitions.
