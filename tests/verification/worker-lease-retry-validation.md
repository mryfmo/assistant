# worker-lease-retry-validation

- Requirement: `ORCH-CORE-0004`
- Objective: prove lease and retry policy checks execute with deterministic rule assertions.

## Procedure

1. Run `bun run check:g6-e2e`.
2. Verify lease/retry rule assertions are executed from contract docs.
3. Confirm retryability rule references remain present.

## Pass Criteria

- Lease and retry policy checks pass.
- Required error codes and retryability section remain defined.
