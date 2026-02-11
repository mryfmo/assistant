# 05_verification — Required Verification

## Mandatory Commands

```bash
bun run typecheck:ts
bun run lint:biome
```

Optional additions (only if such components exist): Python and Rust checks.

## Verification Policy

- Run baseline before changes.
- Run focused checks while iterating.
- Run full suite before reporting completion.
- Keep command outputs in PR evidence.

## Optional Extended Checks

- Integration tests if touched modules have integration impact.
- Performance checks if touched hot path code.
- Manual scenario walkthrough for user-facing behavior.
