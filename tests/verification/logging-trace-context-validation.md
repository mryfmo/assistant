# logging-trace-context-validation

- Requirement: `ORCH-OPS-6003`
- Objective: prove runtime logs carry trace identifiers when trace context is available.

## Procedure

1. Run `bun run check:g7-logging`.
2. Emit one runtime log event with explicit `traceId` and `spanId`.
3. Validate `trace_id` and `span_id` shape and presence in resulting record.

## Pass Criteria

- `trace_id` and `span_id` are included together.
- IDs use lowercase hex with lengths 32 (`trace_id`) and 16 (`span_id`).
