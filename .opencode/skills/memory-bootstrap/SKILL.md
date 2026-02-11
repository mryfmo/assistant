---
name: memory-bootstrap
description: Start-of-session routine to load profile and memory context.
license: MIT
compatibility: opencode
---

## Steps

1) Extract 3-8 keywords from current user intent.
2) Run:
- `memory({ mode: "profile" })`
- `memory({ mode: "search", query: "<keywords>" })`
3) Summarize into:
- preferences
- relevant memories
- constraints/gotchas
4) Use the summary as planning context.
