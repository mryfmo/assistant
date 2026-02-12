# Definition of Done

Implementation is complete only when all conditions below are true.

Audit sync date: 2026-02-12

## Baseline Completion (`spec-pack` profile)

1. All baseline gates pass in CI and local verification runs:
   - `bun run check:g0-docs`
   - `bun run check:g1-contracts`
   - `bun run lint:biome`
   - `bun run typecheck:ts`
   - `bun run check:g5-integration`
   - `bun run check:g6-e2e`
   - `bun run check:g6-topology`
   - `bun run check:g7-security`
2. Local and remote topology invariants for Plan Agent x1 and Task Execution Agents xN pass deterministic pseudo-dispatch validation (`bun run check:g6-topology`, `ORCH-INT-4001`).
3. Clarification and promotion requirements remain contract-linked and executable in validation gates (`ORCH-UX-8001`, `ORCH-OPS-6001`, `ORCH-OPS-6004`).
4. Contract compatibility checks pass for protobuf and schema artifacts (`bun run check:g1-contracts`, `ORCH-API-1001`).
5. Security/logging requirements pass executable checks (`bun run check:g7-security`, `ORCH-OPS-6002`, `ORCH-OPS-6003`, `ORCH-SEC-5002`).

## Runtime Deployment Completion (`runtime-implementation` profile)

- Baseline criteria remain green.
- Plan and execution runtime behavior is validated with executable runtime tests (not only schema/doc checks).
- Clarification blocking and promotion controls are enforced in live execution paths.
- Sandbox dry-run evidence is generated and required before production-impacting execution.
- Runbooks and rollback procedures are validated by executable operational drills.
- Every `ORCH-*` requirement has passing runtime evidence where runtime behavior is required.

## Current Status Snapshot

- `spec-pack` baseline: Ready (all executable gates passing).
- `runtime-implementation` release readiness: Pending (runtime execution coverage not yet complete).
