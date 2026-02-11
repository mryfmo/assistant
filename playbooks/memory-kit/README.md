# OpenCode + Oh My OpenCode Memory Operations Kit

This kit provides a reusable memory workflow for OpenCode projects using `oh-my-opencode` and `opencode-mem`.

It combines:

- Persistent memory (`memory` tool via `opencode-mem`)
- Session compaction support (handoff-focused summaries)
- Team rules (`AGENTS.md`)
- Reusable memory skills (`starter-project/.opencode/skills/*/SKILL.md`)

## Contents

- `starter-global/`
  - `opencode.jsonc`: global plugin and permission example
  - `opencode-mem.jsonc`: memory engine settings example
  - `AGENTS.md`: optional personal memory policy
- `starter-project/`
  - `AGENTS.md`: project memory protocol
  - `opencode.jsonc`: project instruction and permission example
  - `.opencode/oh-my-opencode.json`: project oh-my-opencode settings
  - `.opencode/plugins/omo-memory-compaction.ts`: compaction prompt injection
  - `.opencode/skills/*/SKILL.md`: memory operation skills
- `docs/`
  - architecture, installation, operations, tuning, troubleshooting
- `scripts/`
  - optional install helpers

## Quick Start

1. Add plugins in OpenCode config:
   - `oh-my-opencode`
   - `opencode-mem`
2. Install `starter-global/opencode-mem.jsonc` to `~/.config/opencode/opencode-mem.jsonc`.
3. Copy `starter-project/` into your repository root and merge with existing files by path.
4. Validate in a session:
   - `memory({ mode: "help" })`
   - `memory({ mode: "profile" })`
   - `memory({ mode: "search", query: "<project keyword>" })`

## Security and Operations Notes

- Do not store secrets in memory entries.
- Use `env://` or `file://` for API keys.
- Treat compaction summaries as short-term state; use memory entries for durable long-term knowledge.
