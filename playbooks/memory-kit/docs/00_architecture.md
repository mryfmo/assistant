# Architecture Overview

## Objective

Reduce session forgetfulness and context saturation in long-running agent workflows.

## Building Blocks

- `oh-my-opencode` for orchestration and context controls
- `opencode-mem` for persistent searchable memory
- Compaction hook for structured continuation handoff
- Team rules in `AGENTS.md`
- Reusable memory skills under `.opencode/skills`

## Conceptual Flow

1. Session start:
   - Run memory bootstrap (`profile` + `search`)
2. During execution:
   - Persist high-signal durable facts via `memory.add`
3. At milestones:
   - Use `memory.capture-now`
4. During compaction:
   - Inject handoff format and memory query hints
5. Session resume:
   - Use compaction summary + memory search for fast recovery

## Design Policy

- Preserve high-signal knowledge, not raw transcript bulk.
- Keep short-term state in compaction summary.
- Keep durable cross-session knowledge in memory store.
