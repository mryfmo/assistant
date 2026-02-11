# Example: TypeScript Discriminated Union Refactor

## Goal

Split a large conditional block into typed handlers without losing exhaustiveness checks.

## Before

- Large function with broad `if/else` tree.

## After

- Typed handlers with exhaustive switch retained.

## Verification

```bash
bun run typecheck:ts
bun run lint:biome
```

## Reviewer Notes

- No runtime behavior changes expected.
- Compile-time exhaustiveness protection remains.
