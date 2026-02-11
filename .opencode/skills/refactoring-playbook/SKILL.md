---
name: refactoring-playbook
description: Execute behavior-preserving refactoring using repository playbook and required checks.
license: MIT
compatibility: opencode
---

## Steps

1) Read `playbooks/refactoring/AGENTS.md`.
2) Plan via `playbooks/refactoring/docs/02_workflow.md`.
3) Execute tiny reversible transformations.
4) Run repository verification suite:

- `bun run typecheck:ts`
- `bun run lint:biome`

5) If Python/Rust components exist, run optional language checks:

- `uv run ruff format --check .`
- `uv run ruff check .`
- `uv run ty check .`
- `cargo fmt --check`
- `cargo clippy --all-targets --all-features -- -D warnings`
- `cargo check --all-targets --all-features`

6) Publish evidence and risk note.
