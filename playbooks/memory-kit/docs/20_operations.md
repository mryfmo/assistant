# Operations SOP

## Session Start (required)

1. Run `memory({ mode: "profile" })`
2. Run `memory({ mode: "search", query: "<task keywords>" })`
3. Summarize findings into a short working context block

## During Work

Persist durable, high-signal items with `memory.add`:

- design decisions
- bug-fix lessons
- workflow steps
- coding standards

## Milestones

Run `memory({ mode: "capture-now" })` at meaningful checkpoints.

## Resume After Compaction

Always run memory bootstrap again and use suggested memory queries from handoff.

## Memory Entry Quality Rules

- One memory per fact/decision
- Include concrete anchors (file/module/command/version)
- Never store secrets or personal/sensitive data
