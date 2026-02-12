# Canonical Sources of Truth

The canonical implementation sources are:

1. `docs/06-acceptance/requirements.yaml`
2. `contracts/proto/**`
3. `contracts/jsonschema/**`
4. `docs/00-norms/anti-ambiguity.md`

If any document conflicts with these files, these files win.

# File Inventory

- Architecture: `docs/01-architecture/**`
- Contracts: `docs/02-contracts/**`, `contracts/**`
- Integrations: `docs/03-integrations/**`
- Operations: `docs/04-ops/**`
- Development standards: `docs/05-dev/**`
- Acceptance: `docs/06-acceptance/**`
- User clarification and UX safety: `docs/07-user/**`
- Implementation sequencing: `docs/08-execution/**`
- Architecture decision records: `docs/09-adrs/**`

# How to Validate This Repository

Run the `spec-pack` gate profile defined in `docs/00-norms/validation-gates.md`.

# Completion Criteria

The canonical definition of done is `.agent/CompletionCriteria.md`. The acceptance-facing summary is `docs/06-acceptance/completion-criteria.md`.

# Change Control Rules

- Every requirement change MUST include:
  - requirement diff in `docs/06-acceptance/requirements.yaml`
  - corresponding contract updates (if affected)
  - updated acceptance matrix and tests
- Breaking contract changes MUST increment major contract version.
