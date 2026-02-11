---
name: session-handoff
description: Produce structured handoff and persist durable memory candidates.
license: MIT
compatibility: opencode
---

## Steps

1) Write handoff with goal, status, decisions, working set, and next actions.
2) Persist durable items using `memory-add`.
3) Run `memory({ mode: "capture-now" })`.
