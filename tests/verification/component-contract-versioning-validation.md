# component-contract-versioning-validation

- Requirement: `ORCH-CORE-0010`
- Objective: prove component boundaries are enforced through versioned contracts.

## Procedure

1. Run `bun run check:g5-integration`.
2. Verify component documentation references versioned contract boundaries.
3. Verify contract index paths resolve to versioned proto/jsonschema surfaces.

## Pass Criteria

- Integration check exits with status code `0`.
- Component interface policy retains versioned contract requirement.
