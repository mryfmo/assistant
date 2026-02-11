# 06_diff_strategy — Diff Design Strategy

## Rules

1. One intent per commit.
2. Mechanical changes isolated from semantic changes.
3. Rename/move operations staged before logic edits when possible.
4. Keep noisy generated artifacts out of the diff unless required.

## Recommended Sequence

1. Mechanical prep
2. Structural extraction or move
3. Logic simplification
4. Cleanup and naming polish

## Anti-Patterns

- "Fix everything in one patch"
- Large rename + logic + behavior changes together
- Unexplained wide-scope edits
