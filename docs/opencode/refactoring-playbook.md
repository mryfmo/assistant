# Refactoring Playbook Instructions

When executing refactoring tasks in this repository:

1. Read `playbooks/refactoring/AGENTS.md`.
2. Follow `playbooks/refactoring/docs/02_workflow.md`.
3. Use templates in `playbooks/refactoring/docs/templates/` for plan and risk notes.
4. Run the mandatory verification suite before reporting completion.

Mandatory checks:

- `bun run typecheck:ts`
- `bun run lint:biome`

Optional checks (only if such components are present):

- `uv run --project tooling/optional/python ruff format --check components`
- `uv run --project tooling/optional/python ruff check components`
- `uv run --project tooling/optional/python ty check components`
- `cargo fmt --manifest-path <components/rust-*/Cargo.toml> --check`
- `cargo clippy --manifest-path <components/rust-*/Cargo.toml> --all-targets --all-features -- -D warnings`
- `cargo check --manifest-path <components/rust-*/Cargo.toml> --all-targets --all-features`
