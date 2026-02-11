# workflow-correlation-e2e

- Requirement: `ORCH-CORE-0001`
- Objective: prove all emitted records keep one immutable `workflow_id`.

## Procedure

1. Start one workflow from intent submission.
2. Capture events, task records, and artifact registrations.
3. Assert that every captured record contains the same `workflow_id` value.

## Pass Criteria

- 100% of captured records include `workflow_id`.
- Exactly one unique `workflow_id` appears in the capture set.
