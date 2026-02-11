# 11_playbooks — Common Refactoring Playbooks

## Playbook A: Large File Decomposition

1. Define module boundaries.
2. Move types/interfaces first.
3. Move pure helpers.
4. Move side-effecting functions last.
5. Re-run full checks.

## Playbook B: Error Handling Cleanup

1. Inventory current error paths.
2. Define normalized error mapping.
3. Refactor wrappers without changing codes/messages semantics.
4. Verify with existing failure scenarios.

## Playbook C: Naming and Responsibility Cleanup

1. Rename for intent clarity.
2. Extract cohesive units.
3. Remove dead abstractions.
4. Preserve call-site behavior.
