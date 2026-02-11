# Project Rules (AGENTS.md)

This file is loaded by OpenCode as repository-level rules.

## Memory Protocol (required)

This project uses `opencode-mem` as a persistent knowledge layer.

### Session Start

1. Run `memory({ mode: "profile" })`
2. Run `memory({ mode: "search", query: "<task keywords>" })`
3. Summarize findings into a compact context block

### When to use `memory.add`

Persist these categories:

- decision / architecture
- bug-fix / gotcha
- workflow
- coding-standards

### Entry Quality

- One memory per fact/decision
- Include file/module/command anchors
- Never store secrets
- Avoid duplicate memory items

### Milestones

Run `memory({ mode: "capture-now" })` at meaningful checkpoints.

## Compaction and Resume Protocol

- Treat compaction as expected for long sessions.
- After compaction, run memory bootstrap first.
- Prioritize any `Memory Search Query` from handoff summary.

## Background Agent Policy

- Background agents should propose memory candidates.
- Main agent performs final `memory.add` writes.
