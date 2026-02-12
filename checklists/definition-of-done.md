# Definition of Done Checklist

Canonical definition of done: `.agent/CompletionCriteria.md`. This checklist is a quick-reference template for PR and release gating.

This file is a template; mark completion in this list only for process tracking. The canonical acceptance trail remains `.agent/CompletionCriteria.md` and `docs/06-acceptance/requirements.yaml`.

- [ ] All `spec-pack` profile gates pass (`bun run check:g0-docs`, `check:g1-contracts`, `lint:biome`, `typecheck:ts`, `check:g5-integration`, `check:g6-e2e`, `check:g6-topology`, `check:g7-security`).
- [ ] Plan Agent x1 and Task Execution Agents xN topology invariants validated (`bun run check:g6-topology`).
- [ ] Clarification gate policy contract-linked and enforced in spec validation.
- [ ] Sandbox-to-production promotion policy contract-linked and enforced in spec validation.
- [ ] Contracts and acceptance matrix are synchronized.
- [ ] Optional language checks pass when optional components are present.
