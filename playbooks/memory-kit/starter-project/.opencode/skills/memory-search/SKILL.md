---
name: memory-search
description: Search relevant memories and summarize into actionable context.
license: MIT
compatibility: opencode
---

## What I do
I retrieve relevant memories and turn them into a concise working context.

### Action
1) Call:
`memory({ mode: "search", query: "<query>" })`
2) Summarize:
- Top 3-10 relevant items
- Any contradictions / outdated entries
3) Propose next actions using those constraints.

