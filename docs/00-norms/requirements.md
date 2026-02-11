# Requirement Format

Each requirement MUST use this shape:

```yaml
- id: ORCH-CORE-0001
  statement: "..."
  rationale: "..."
  contracts: ["..."]
  gate: ["G1"]
  verification: ["..."]
```

# Traceability Rules

- IDs are immutable.
- IDs MUST be unique.
- Every ID MUST appear in `acceptance-matrix.md`.

# Acceptance Test Rules

- Every requirement MUST have one or more objective tests.
- Tests MUST define expected outputs and pass criteria.

# Deprecation and Tombstones

Deprecated requirements remain in history with status `deprecated` and replacement ID.
