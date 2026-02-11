# logging-redaction-validation

- Requirement: `ORCH-SEC-5002`
- Objective: prove sensitive values are redacted before logs are emitted.

## Procedure

1. Run `bun run check:g7-logging`.
2. Inspect generated sample runtime log payload values.
3. Confirm sensitive keys are replaced with `[REDACTED]`.

## Pass Criteria

- Keys such as `password`, `token`, `authorization`, and `apiKey` are always redacted.
- Validation fails when any secret-like value is emitted in clear text.
