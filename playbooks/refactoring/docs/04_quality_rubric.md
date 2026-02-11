# 04_quality_rubric — Senior-Level Refactoring Rubric

Score each dimension from 1 (poor) to 5 (excellent).

## Correctness

- 5: Boundary fully preserved with strong evidence.
- 3: Mostly preserved but weak evidence in some areas.
- 1: Behavior risk or missing proof.

## Precision

- 5: Minimal, intention-revealing diff.
- 3: Mostly focused with some avoidable noise.
- 1: Mixed and unclear changes.

## Safety

- 5: Reversible, staged, and failure-aware.
- 3: Basic rollback exists but not explicit.
- 1: Risky and hard to recover.

## Maintainability

- 5: Better cohesion, clearer names, simpler flow.
- 3: Modest improvement.
- 1: Added complexity.

## Performance Discipline

- 5: No regression and measurement-aware.
- 3: No clear evidence.
- 1: Regressions introduced.

## Security and Operational Integrity

- 5: No degradation to controls, logs, or diagnostics.
- 3: Mostly unchanged.
- 1: Security or observability weakened.

Use this rubric in review notes and retrospectives.
