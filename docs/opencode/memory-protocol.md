# Memory Protocol

This repository uses `opencode-mem` as a durable memory layer.

## Required Routine (Canonical: `memory({ mode })`)

At session start:

1. `memory({ mode: "profile" })` *(skill: `memory-bootstrap`)*
2. `memory({ mode: "search", query: "<task keywords>" })` *(skill: `memory-search`)*
3. Summarize results before planning edits

During work:

- Persist durable high-signal findings with `memory({ mode: "add", ... })` *(skill: `memory-add`)*.
- Use `memory({ mode: "capture-now" })` at major milestones *(skill: `memory-capture-now`)*.
- Run `memory({ mode: "handoff" })` at session end if work remains *(skill: `session-handoff`)*.

## Safety

- Never store secrets, tokens, or sensitive personal data.
- Keep one memory entry per fact or decision.
- Include concrete anchors (file/module/command).
