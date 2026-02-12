# Completion Criteria

The canonical definition of done is maintained in `.agent/CompletionCriteria.md`. This file summarizes the acceptance view.

## spec-pack Profile

v1 spec-pack is complete only if all conditions below are satisfied.

1. All gates in the `spec-pack` profile pass in CI, including `bun run check:g0-docs`, `bun run check:g1-contracts`, `bun run lint:biome`, `bun run typecheck:ts`, `bun run check:g5-integration`, `bun run check:g6-e2e`, `bun run check:g6-topology`, and `bun run check:g7-security`.
2. Plan Agent x1 and Task Execution Agents xN topology invariants are validated under local and remote pseudo-dispatch simulation (`bun run check:g6-topology`).
3. Clarification gate policy is contract-linked and enforced in spec validation (`ORCH-UX-8001`).
4. Sandbox dry-run evidence requirements are contract-linked and enforced in spec validation (`ORCH-SKILL-3001`).
5. Contract compatibility checks pass for protobuf and JSON schema artifacts through `bun run check:g1-contracts`.
6. Security controls (mTLS, redaction, capability scope) are specified and validated at the document and schema level (`ORCH-SEC-5001`, `ORCH-SEC-5002`).

## runtime-implementation Profile

For runtime deployment releases, the `runtime-implementation` profile applies. It is structured in 7 phases (P1-P7) with milestones M5-M11. Each phase adds runtime depth to the gate checks while keeping spec-pack gates green.

Key milestones:
- **M7** (Phase 3): One-command local demo completes workflows end-to-end with real Postgres.
- **M8** (Phase 4): Chaos-concurrency test passes with no double-exec and no state corruption.
- **M10** (Phase 6): Skill cannot reach prod without sandbox evidence + explicit approval.
- **M11** (Phase 7): staging/prod refuse non-mTLS; remote workers complete workflows.
- Runtime-readiness closure for M11 requires transport-level gRPC mTLS evidence. Bun metadata fallback is local-only evidence.

See `.agent/CompletionCriteria.md` for the full phased runtime definition of done and `.agent/ExecPlan.md` for phase details, dependency graph, and risk register.

## Transition Criteria

The `spec-pack` profile is sufficient while implementation consists of specification documents, contracts, and validation tooling only. Transition to the `runtime-implementation` profile is required when any of these conditions are met:

- A Plan Agent, Task Execution Agent, or Scheduler component is implemented beyond type stubs.
- A gRPC or HTTP service endpoint is implemented.
- A persistence layer (database, queue) is integrated.
- Any component performs side-effecting execution in sandbox or higher environments.
