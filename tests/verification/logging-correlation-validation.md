# logging-correlation-validation

- Requirement: `ORCH-OPS-6002`
- Objective: prove every runtime log event includes mandatory correlation fields.

## Procedure

1. Run `bun run check:g7-logging`.
2. Capture emitted sample runtime log record.
3. Verify required fields and non-empty values.

## Pass Criteria

- Log schema requires `workflow_id`, `task_id`, and `request_id`.
- Sample runtime log record includes all required correlation fields.
