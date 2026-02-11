import type { Plugin } from "@opencode-ai/plugin"

export const OmoMemoryCompactionPlugin: Plugin = async () => {
  const injection = `
## Continuation Handoff (OMO + opencode-mem)

When you generate the continuation summary, follow this structure strictly.

### 1) Goal & Status
- What is the user trying to achieve?
- Current status (done / in-progress / blocked)

### 2) Key Decisions (high signal)
- Bullet list of decisions and rationales (short)
- Do NOT include secrets

### 3) Working Set
- Files touched / key modules
- Commands run (only if essential)

### 4) Open Threads
- TODOs that must be resumed
- Known risks / gotchas

### 5) Memory Search Query
Provide 1-3 queries that the next session should run with:
- memory({ mode: "search", query: "<query>" })

### 6) Memory Candidates
List bullets that SHOULD be persisted to long-term memory (opencode-mem) via:
- memory({ mode: "add", type: "<type>", content: "<atomic fact>" })

Types guideline:
- architecture | decision | workflow | bug-fix | gotcha | coding-standards
`

  return {
    "experimental.session.compacting": async (_input, output) => {
      if (typeof output.prompt === "string" && output.prompt.length > 0) {
        output.prompt = `${output.prompt}\n\n${injection}`
        return
      }
      output.context.push(injection)
    },
  }
}
