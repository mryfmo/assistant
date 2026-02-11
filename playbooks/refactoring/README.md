# Refactoring Docs (TypeScript-first)

This package is a practical refactoring playbook for the `assistant` project. It is designed for both humans and coding agents.

Goals:

- Improve internal structure without changing observable behavior.
- Keep diffs small, reviewable, and reversible.
- Maintain high confidence through objective evidence.
- Provide reusable templates for planning, execution, review, and handoff.

Reference definitions:

- Martin Fowler: <https://martinfowler.com/bliki/DefinitionOfRefactoring.html>
- refactoring.com: <https://refactoring.com/>

## Quick Start

1. Read `docs/02_workflow.md` and define your spec boundary.
2. Run baseline checks listed in `docs/05_verification.md`.
3. Pick language-specific guidance in `docs/languages/`.
4. Use templates in `docs/templates/` for plan, risk, and PR text.

## How This Draft Is Used In This Repository

This draft is now aligned with this repository's toolchain and can be used directly for refactoring tasks:

- Mandatory checks: `bun run typecheck:ts`, `bun run lint:biome`
- Optional checks (only if such components are introduced): Python and Rust suites

Use this draft together with root-level governance:

- `AGENTS.md`
- `docs/00-norms/anti-ambiguity.md`
- `docs/06-acceptance/requirements.yaml`

## Directory Layout

- `AGENTS.md`: Refactoring agent contract
- `SKILL.md`: Refactoring skill specification
- `docs/`: principles, workflow, quality rubric, verification, templates, examples

## Notes

- This package is guidance, not an automatic compliance system.
- Always define and document the spec boundary before changing code.
