# Installation Guide

## Prerequisites

- OpenCode available on local machine
- `oh-my-opencode` and `opencode-mem` installed

## 1) Global Setup (`~/.config/opencode`)

1. Add plugins to `opencode.jsonc`:
   - `oh-my-opencode`
   - `opencode-mem`
2. Copy `../starter-global/opencode-mem.jsonc` to `~/.config/opencode/opencode-mem.jsonc`.

Recommended settings:

- Local embedding model when possible
- `autoCaptureEnabled: true`
- API keys via `env://` or `file://`

## 2) Project Setup (repository root)

Copy `../starter-project/` into repository root and merge:

- `AGENTS.md`
- `opencode.jsonc`
- `.opencode/`

## 3) Validation

In a session, run:

- `memory({ mode: "help" })`
- `memory({ mode: "profile" })`
- `memory({ mode: "search", query: "<project keyword>" })`
