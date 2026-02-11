# 00_overview — Scope and Baseline

This playbook defines safe, behavior-preserving refactoring for the `assistant` repository.

## In Scope

- Production code in active repository components (currently TypeScript-first).
- Internal structure improvements: readability, cohesion, testability, dependency direction, duplication reduction.

## Out of Scope

- Feature development and behavior changes.
- Contract changes without explicit requirement updates.
- Rewrite-first migrations without rollback strategy.

## Why Behavior-Preserving Refactoring Fails

- Spec boundaries are often implicit.
- Observable behavior is broader than tests.
- Mixed-purpose diffs hide risk.

## Change Categories

1. Refactor (behavior preserved)
2. Behavior change (spec change)
3. Optimization (performance-focused)
4. Chore (mechanical updates)

Do not mix categories in one patch set.

## Observable Boundary Checklist

- Public API and CLI behavior
- Data schema and serialization
- Error codes/messages and status mapping
- Logging/metrics used by operations
- Security boundaries and validation behavior

## Repository Verification Commands

- `bun run typecheck:ts`
- `bun run lint:biome`

Optional (if such components exist):

- `uv run --project tooling/optional/python ruff format --check components`
- `uv run --project tooling/optional/python ruff check components`
- `uv run --project tooling/optional/python ty check components`
- `cargo fmt --manifest-path <components/rust-*/Cargo.toml> --check`
- `cargo clippy --manifest-path <components/rust-*/Cargo.toml> --all-targets --all-features -- -D warnings`
- `cargo check --manifest-path <components/rust-*/Cargo.toml> --all-targets --all-features`

Next: `01_principles.md`.
