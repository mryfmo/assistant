# 03_definition_of_done — Objective Completion Bar

A refactoring task is done only when all are true:

1. Scope stayed inside the declared refactor boundary.
2. Full static/type/lint suite passed.
3. No unreviewed contract changes were introduced.
4. Diff remains focused and reviewable.
5. Rollback strategy is documented.
6. PR text includes evidence and rationale.

If any condition fails, task status is not "done".
