---
name: memory-forget
description: Delete a memory by id (cleanup incorrect/outdated memories).
license: MIT
compatibility: opencode
---

## What I do
I help you remove incorrect or outdated memories.

### Action
1) Identify the memory id (from search/list or UI).
2) Call:
`memory({ mode: "forget", memoryId: "<mem_id>" })`
3) Optionally add a corrected memory.

