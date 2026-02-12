# skill-sandbox-dryrun-validation

- Requirement: `ORCH-SKILL-3001`
- Objective: prove skill compilation flow requires sandbox dry-run evidence before promotion-eligible execution.

## Procedure

1. Run `bun run check:g6-e2e`.
2. Verify skills integration requirements include sandbox validation expectations.
3. Verify promotion policy keeps sandbox validation as a prerequisite.

## Pass Criteria

- Skill flow checks pass with sandbox validation requirement present.
- Promotion path does not permit progression without sandbox evidence.
