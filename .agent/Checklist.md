# Execution Checklist

Audit sync date: 2026-02-12

## Verified in `spec-pack` (executable today)

- [x] All requirement IDs are unique and mapped to acceptance artifacts and gate rows (`validateGateTraceability` in G0/G1/G5/G6/G7 checks).
- [x] Contract inventory and local markdown links validate cleanly (`bun run check:g0-docs`).
- [x] Step 3-6 in `docs/08-execution/execution-plan.md` are requirement-ID mapped and validated by executable check (`bun run check:g0-docs`).
- [x] Protobuf contracts pass lint and backward-compatibility checks (`bun run check:g1-contracts` with `buf lint` and `buf breaking`).
- [x] JSON schema and OpenAPI invariants are validated (`bun run check:g1-contracts`).
- [x] TypeScript lint and typecheck pass (`bun run lint:biome`, `bun run typecheck:ts`).
- [x] Integration, E2E, topology, and security checks pass (`bun run check:g5-integration`, `bun run check:g6-e2e`, `bun run check:g6-topology`, `bun run check:g7-security`).

## Pending for `runtime-implementation` profile

- [ ] Plan Agent deterministic graph behavior is validated against executable runtime, not only contract/doc checks.
- [ ] Worker lease/heartbeat/retry/cancel behavior is validated against running workers.
- [ ] Idempotency behavior is validated against duplicate side-effect attempts.
- [ ] Skill compilation pipeline emits runnable artifacts with executable sandbox evidence collection.
- [ ] Promotion and rollback controls are validated in runtime operation paths.
- [ ] Optional Python/Rust gates are exercised when those components are introduced.

## Notes

- This checklist tracks execution status, not only document intent.
- Runtime-deployment readiness is blocked until the pending profile items above are executable and passing.
