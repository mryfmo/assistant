# Gate List

- G0 Docs: markdown lint/link/inventory consistency.
- G1 Contracts: proto/jsonschema lint and compatibility checks.
- G2 TypeScript: `bun run lint:biome` + `bun run typecheck:ts`.
- G3 Python (optional): run only when Python components are present.
- G4 Rust (optional): run only when Rust components are present.
- G5 Integration: verification artifacts for integration scenarios are present and trace-linked.
- G6 E2E: verification artifacts for E2E scenarios are present and trace-linked.
- G7 Security: security policy artifacts are present and consistent.

# Gate Profiles

- `spec-pack` profile (this repository baseline): G0, G1, G2, G5, G6, G7.
- `runtime-implementation` profile (when runtime components exist): G0-G7, with executable integration/E2E/security tests.

G3 and G4 are active only when corresponding language components are present.

Activation criteria:

- G3 activates when `components/**` contains one or more `.py` files.
- G4 activates when `components/**` contains one or more `.rs` files.

# Gate Inputs

- Source files, contracts, docs, checklists, and CI configs.

# Gate Pass/Fail Criteria

- Any non-zero exit code fails the gate.
- Missing required artifacts fail the gate.
- Contract drift fails the gate.

# Required Artifacts

- Acceptance evidence linked in `docs/06-acceptance/acceptance-matrix.md`.
- CI logs for each gate.
