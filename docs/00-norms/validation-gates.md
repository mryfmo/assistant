# Gate List

Each gate has a `spec-pack` scope (document/schema validation) and a `runtime-implementation` scope (live behavior validation). The spec-pack scope is active by default. Runtime scope activates per the transition criteria in `.agent/CompletionCriteria.md`.

- G0 Docs — Document quality, link integrity, contract inventory, and requirement traceability: `bun run check:g0-docs`.
- G1 Contracts — Proto syntax, JSON Schema metadata, OpenAPI version, buf lint/breaking, and contract inventory consistency: `bun run check:g1-contracts`.
- G2 TypeScript — Lint and type safety: `bun run lint:biome` + `bun run typecheck:ts`.
- G3 Python (optional) — Activated only when Python components are present.
- G4 Rust (optional) — Activated only when Rust components are present.
- G5 Spec Consistency (Contract Fields) — Proto message field presence and versioned-contract boundary assertions: `bun run check:g5-integration`. Under `runtime-implementation`, this gate additionally validates live cross-component integration.
- G6 Spec Consistency (Requirements) — Schema structure, document-level requirement assertions, and pseudo-dispatch topology simulation: `bun run check:g6-e2e` and `bun run check:g6-topology`. Under `runtime-implementation`, this gate additionally validates live end-to-end orchestration flows.
- G7 Security and Logging — Security model assertions, logging schema validation, and runtime logging behavior: `bun run check:g7-security` (which invokes `bun run check:g7-logging` as a sub-check).

# Gate Profiles

- `spec-pack` profile (this repository baseline): G0, G1, G2, G5, G6, G7.
- `runtime-implementation` profile (when runtime components exist): G0-G7, with executable integration/E2E/security tests against live components.

G3 and G4 are active only when corresponding language components are present.

# Gate Activation Criteria

- G3 activates when `components/**` contains one or more `.py` files.
- G4 activates when `components/**` contains one or more `.rs` files.
- G3/G4 component introduction is driven by implementation requirements; there is no preset timeline. When a requirement necessitates Python or Rust modules (e.g., a Rust-based skill runtime or Python-based ML pipeline), the component is added to `components/` and the corresponding gate activates automatically via CI detection.

# Gate Inputs

- Source files, contracts, docs, checklists, and CI configs.

# Gate Pass/Fail Criteria

- Any non-zero exit code fails the gate.
- Missing required artifacts fail the gate.
- Contract drift fails the gate.
- Active gate command failure fails the gate.

# Required Artifacts

- Acceptance evidence linked in `docs/06-acceptance/acceptance-matrix.md`.
- CI logs for each gate.
- Gate scripts MUST validate requirement-to-matrix-to-verification consistency.

# Scope Clarification

Under the `spec-pack` profile, G5/G6/G7 gate checks validate specification consistency: schema field presence, document content assertions, requirement traceability, and pseudo-dispatch topology simulation. They do not exercise live runtime behavior. The naming reflects the validation domain (integration, e2e, security), not the validation depth — depth increases when the `runtime-implementation` profile is activated.

# Acceptance Matrix Runtime Evidence Semantics

- Under the `spec-pack` profile, runtime evidence links in the `Pass Criteria` column are supplemental references.
- Normative traceability checks are enforced from `Requirement ID`, `Verification Artifact`, and `Gate(s)` via `tooling/verification/lib/acceptance-trace.ts`.
- Under the `runtime-implementation` profile, runtime evidence links are required executable evidence and MUST map to passing runtime tests.
