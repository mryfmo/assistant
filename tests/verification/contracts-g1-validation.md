# contracts-g1-validation

- Requirement: `ORCH-API-1001`
- Objective: prove protobuf and JSON schema contracts pass executable compatibility checks.

## Procedure

1. Run `bun run check:g1-contracts`.
2. Confirm proto package/version and field-number validation executes.
3. Confirm JSON schema version and metadata checks execute.
4. Confirm `buf lint contracts/proto` executes with configured rules.
5. Confirm `buf breaking contracts/proto --against .git#branch=origin/main,subdir=contracts/proto` executes.

## Pass Criteria

- The command exits with status code `0`.
- Proto and schema artifacts pass validation without compatibility errors.
- OpenAPI and proto tooling configuration checks pass.
- Buf lint and breaking checks pass against the configured baseline.
