# Memory Protocol

This repository uses `opencode-mem` as a durable memory layer.

## Required Routine

At session start:

1. `memory({ mode: "profile" })`
2. `memory({ mode: "search", query: "<task keywords>" })`
3. Summarize results before planning edits

During work:

- Persist durable high-signal findings with `memory({ mode: "add", ... })`.
- Use `memory({ mode: "capture-now" })` at major milestones.

## Safety

- Never store secrets, tokens, or sensitive personal data.
- Keep one memory entry per fact or decision.
- Include concrete anchors (file/module/command).
