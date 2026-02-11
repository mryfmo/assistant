# AGENTS.md — Refactoring Agent Contract

This contract defines how to perform safe refactoring in this repository.

Refactoring means improving internal structure while preserving observable behavior.

## Terms

- Refactoring: behavior-preserving structural improvement.
- Spec boundary: all externally observable behavior that must not change.
- Mechanical change: formatting/import/order updates with no logic impact.

## Hard Constraints

1. Do not cross the spec boundary.
2. Keep changes small and reviewable.
3. Keep every step reversible.
4. Provide objective evidence for safety.
5. Do not mix feature changes into refactoring work.

## Required Workflow

1. Define scope and spec boundary.
2. Capture baseline checks before code changes.
3. Decompose into tiny transformations.
4. Execute one transformation at a time.
5. Run verification gates after each logical unit.
6. Publish concise rationale and evidence.

## Mandatory Verification For This Repository

- `bun run typecheck:ts`
- `bun run lint:biome`

## Optional Verification (Only If Components Exist)

- `uv run --project tooling/optional/python ruff format --check components`
- `uv run --project tooling/optional/python ruff check components`
- `uv run --project tooling/optional/python ty check components`
- `cargo fmt --manifest-path <components/rust-*/Cargo.toml> --check`
- `cargo clippy --manifest-path <components/rust-*/Cargo.toml> --all-targets --all-features -- -D warnings`
- `cargo check --manifest-path <components/rust-*/Cargo.toml> --all-targets --all-features`

## Disqualification Conditions

- No baseline evidence.
- API behavior change without explicit scope update.
- Large mixed diffs with hidden intent.
- No rollback path.

## Expected Deliverables

- Refactor plan: `docs/templates/refactor_plan.md`
- Risk sheet: `docs/templates/risk_assessment.md`
- PR text: `docs/templates/pr_description.md`
- Optional design note: `docs/templates/adr.md`

## Language-Specific Guidance

- TypeScript: `docs/languages/typescript.md`
- Python: `docs/languages/python.md`
- Rust: `docs/languages/rust.md`
