# Definition of Done

Implementation is complete only when all conditions below are true.

## Functional Completion

- Plan Agent x1 and Task Execution Agents xN run with local and remote dispatch.
- Clarification gate resolves ambiguous/risky user intent before execution.
- Sandbox execution is mandatory before production promotion.

## Contract Completion

- All contract files are versioned and validated.
- Implementation conforms to contracts without ad hoc protocol drift.

## Quality Completion

- Gates in the `spec-pack` profile pass in CI.
- Static analysis and formatting pass for TypeScript.
- Optional language checks pass when optional components are present.

## Operational Completion

- Runbooks exist for major incident classes.
- Promotion policy and rollback policy are tested and documented.

## Acceptance Completion

- Every `ORCH-*` requirement in `docs/06-acceptance/requirements.yaml` has passing evidence.
