---
name: memory-bootstrap
description: Start-of-session routine: load profile + search memories and summarize.
license: MIT
compatibility: opencode
---

## What I do
I help you start a session with persistent memory.

### Steps
1) Read user intent and extract 3-8 keywords.
2) Call:
- `memory({ mode: "profile" })`
- `memory({ mode: "search", query: "<keywords / intent>" })`
3) Summarize results into a short “Session Context” section:
- Preferences (from profile)
- Relevant project memories (top results)
- Constraints / gotchas
4) Proceed with the actual task, referencing this context.

### Notes
- Avoid copying long memory contents verbatim; summarize.
- If search results are noisy, refine the query and rerun.

