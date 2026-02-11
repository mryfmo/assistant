# TypeScript Refactoring Notes

## Typical Risks

- Union narrowing regressions.
- Inferred `any` creeping in through helper extraction.
- Async flow changes that alter ordering or error propagation.

## Guidance

- Keep strict typing intact.
- Preserve discriminated union guards.
- Keep async behavior explicit and deterministic.

## Project Check Commands

```bash
bun run typecheck:ts
bun run lint:biome
```
