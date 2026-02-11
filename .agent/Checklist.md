# Execution Checklist

## Governance

- [ ] All requirement IDs are unique and mapped to acceptance tests.
- [ ] No ambiguous language remains (no TBD, etc., maybe, later).
- [ ] All cross-boundary interactions have contracts.

## Contracts

- [ ] Protobuf contracts lint clean and backward-compatibility checked.
- [ ] JSON schemas validate sample payloads.
- [ ] Error code set is closed and documented.

## Orchestration Runtime

- [ ] Plan Agent emits deterministic task graphs.
- [ ] Worker lease / heartbeat / retry / cancellation behavior is implemented.
- [ ] Idempotency policy prevents duplicate side effects.

## Skills and Execution

- [ ] Skill compilation pipeline produces valid artifacts.
- [ ] Sandbox dry-run captures required evidence.
- [ ] Promotion policy blocks unsafe direct production execution.

## Quality Gates

- [ ] TypeScript lint + format + typecheck pass.
- [ ] Python ruff + ty + format pass when Python components exist.
- [ ] Rust fmt + clippy + check pass when Rust components exist.
- [ ] Acceptance matrix is fully satisfied.
