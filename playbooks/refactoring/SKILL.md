# SKILL.md — Refactoring Skill Specification

This skill defines an execution contract for behavior-preserving refactoring in this repository.

## Goal

- Improve structure (complexity, cohesion, coupling, duplication) without changing observable behavior.
- Produce small, auditable, reversible changes.
- Provide reproducible quality evidence.

## Inputs

Required:

1. Target scope (files/modules).
2. Refactoring objective.
3. Spec boundary and non-goals.
4. Required verification gates.
5. Language scope (Python, Rust, TypeScript).

Optional:

- Performance constraints.
- Security constraints.
- Existing architectural constraints.

## Outputs

Required:

1. Minimal patch set.
2. Step-by-step plan.
3. Verification command log.
4. Rationale and risk note.

## Constraints

- No feature behavior change.
- No mixed mechanical + semantic mega-diff.
- Evidence-first decisions only.
- Keep rollback path clear.

## Standard Procedure

1. Discover: read code, define spec boundary.
2. Baseline: run full checks before editing.
3. Plan: decompose to tiny steps.
4. Transform: apply one step at a time.
5. Verify: run mandatory checks.
6. Polish: remove noise and tighten naming.

## Mandatory Verification Commands

- `bun run typecheck:ts`
- `bun run lint:biome`

## Optional Verification Commands (Only If Components Exist)

- `uv run --project tooling/optional/python ruff format --check components`
- `uv run --project tooling/optional/python ruff check components`
- `uv run --project tooling/optional/python ty check components`
- `cargo fmt --manifest-path <components/rust-*/Cargo.toml> --check`
- `cargo clippy --manifest-path <components/rust-*/Cargo.toml> --all-targets --all-features -- -D warnings`
- `cargo check --manifest-path <components/rust-*/Cargo.toml> --all-targets --all-features`

## Rubric Summary

- Correctness
- Precision
- Safety
- Maintainability
- Performance
- Security
- Throughput

## Language Profiles

- `docs/languages/typescript.md`
- `docs/languages/python.md`
- `docs/languages/rust.md`
