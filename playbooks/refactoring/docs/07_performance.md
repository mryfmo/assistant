# 07_performance — Performance Discipline

Refactoring is not a free license for speculative optimization.

## Rules

- Measure before claiming improvement.
- Prevent regression on known hot paths.
- Keep optimization changes explicit and separately justified.

## Practical Guidance

- If no benchmark exists, at least compare representative command/runtime behavior.
- Avoid introducing heavier abstractions in tight loops.
- Watch for hidden allocations and repeated parsing in Rust/TypeScript/Python.
