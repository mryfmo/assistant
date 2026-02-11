---
name: memory-add
description: Add a high-quality atomic memory (decision/gotcha/workflow).
license: MIT
compatibility: opencode
---

## What I do
I help you write durable, searchable memories.

### Checklist (before writing)
- Is it stable knowledge (not ephemeral)?
- Is it one fact/decision per memory?
- Does it include concrete anchors (file/module/command/version)?
- Does it avoid secrets?

### Action
Call:
`memory({ mode: "add", type: "<type>", content: "<atomic memory>" })`

Recommended types:
- architecture | decision | workflow | bug-fix | gotcha | coding-standards

