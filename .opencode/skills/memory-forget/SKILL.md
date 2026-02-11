---
name: memory-forget
description: Remove incorrect or stale memory entries by id.
license: MIT
compatibility: opencode
---

## Action

1) Identify memory id.
2) `memory({ mode: "forget", memoryId: "<mem_id>" })`
3) Add corrected entry if needed.
