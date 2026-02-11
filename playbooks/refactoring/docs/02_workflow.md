# 02_workflow — Execution Workflow

## Step A: Define Boundary

- List observable behaviors that must remain unchanged.
- Record explicit non-goals.
- Identify interfaces touched by the refactor.

## Step B: Baseline

Run repository checks before any edits:

```bash
bun run typecheck:ts
bun run lint:biome
```

Optional additions (only if such components exist): Python and Rust checks.

## Step C: Plan Tiny Transformations

- Decompose work into 1-intent steps.
- Attach success criteria to each step.
- Define rollback path per step.

## Step D: Execute

- Apply one transformation.
- Re-run relevant checks.
- Stop if boundary risk appears.

## Step E: Verify

- Re-run full suite.
- Confirm no contract drift.
- Prepare evidence for review.

## Step F: Publish

- Explain why behavior is preserved.
- Include command outputs and risk note.
