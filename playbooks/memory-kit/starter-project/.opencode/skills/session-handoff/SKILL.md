---
name: session-handoff
description: Create a structured handoff summary and persist key items to memory.
license: MIT
compatibility: opencode
---

## What I do
I produce a handoff and persist key knowledge.

### Steps
1) Write a handoff with:
- Goal, status
- Decisions
- Working set (files/modules)
- Open threads / next steps
2) Convert “durable” items into atomic memories and add them:
- `memory({ mode: "add", type: "...", content: "..." })`
3) Trigger capture:
- `memory({ mode: "capture-now" })`

