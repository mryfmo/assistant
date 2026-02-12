# docs-g0-validation

- Requirement: `ORCH-DX-7001`
- Objective: prove documentation lint/link/inventory checks are executable and enforceable.

## Procedure

1. Run `bun run check:g0-docs`.
2. Confirm markdown link validation runs across docs/checklists/verification artifacts.
3. Confirm contract inventory references resolve to existing files or valid wildcard matches.

## Pass Criteria

- The command exits with status code `0`.
- No broken local markdown links are reported.
- No inventory drift or prohibited ambiguity phrases are reported.
