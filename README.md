# Overview

This repository is an implementation-ready specification pack for a distributed agent orchestration platform:

- Plan Agent x 1
- Task Execution Agents x N (local and remote)
- OpenWork + OpenCode + OhMyOpenCode + Skills + Subagents + Chrome/Playwright integration

All docs and contracts are written to minimize ambiguity for direct implementation by GPT-5.3 Codex.

# System Model (Plan Agent -> Task Execution Agents)

1. User intent is received in OpenWork.
2. Plan Agent generates a structured execution graph and `SkillSpec`.
3. Clarification gate resolves missing or risky intent with plain-language questions.
4. Compiler builds skill artifacts and runtime metadata.
5. Sandbox validation runs before production promotion.
6. Scheduler dispatches tasks to local/remote execution workers.
7. Results and artifacts are streamed and audited.

# Quickstart (Sandbox)

```bash
git clone <repo-url> assistant
cd assistant
```

Read first:

- `docs/BLUEPRINT.md`
- `docs/00-norms/anti-ambiguity.md`
- `docs/08-execution/execution-plan.md`

# Running a Full E2E Scenario

1. Validate documents and contracts using `docs/00-norms/validation-gates.md`.
2. Start sandbox deployment using `docs/04-ops/deploy-sandbox.md`.
3. Execute acceptance scenario in `docs/06-acceptance/completion-criteria.md`.

# Contracts and Compatibility

- Protobuf contracts: `contracts/proto/**`
- JSON Schema contracts: `contracts/jsonschema/**`
- Integration contracts and adapter rules: `docs/03-integrations/**`

# Validation Gates (CI)

See `docs/00-norms/validation-gates.md` for gate profiles and activation rules.

# Promotion Policy (Sandbox -> Staging -> Prod)

Promotion rules are defined in `docs/04-ops/promotion-policy.md`. No bypass is allowed.

# Security Model (mTLS, scopes, redaction)

Security controls, trust boundaries, and redaction requirements are defined in `docs/01-architecture/security-model.md` and `docs/02-contracts/authn-authz.md`.

# Repository Layout

- `docs/` architecture, requirements, operations, acceptance
- `contracts/` API contracts and schemas
- `.agent/` execution plans and completion checklists
- `.opencode/` project-local OpenCode skills and plugins
- `playbooks/` reusable refactoring and memory operation playbooks
- `checklists/` PR/release/incident gates
- `tests/verification/` requirement-linked verification artifacts
- `tooling/` lint/format/type/toolchain configuration
- `src/core/orchestrator/` orchestration flow core
- `src/core/contracts/` TypeScript runtime contract types
- `src/core/runtime/` execution/runtime helpers
- `components/` optional language-specific modules (activated by requirement)

# OpenCode Extensions

- Project config: `opencode.jsonc`
- Memory config template: `opencode-mem.jsonc`
- OhMyOpenCode config: `.opencode/oh-my-opencode.json`
- Memory and refactoring skills: `.opencode/skills/*`
- Compaction plugin: `.opencode/plugins/omo-memory-compaction.ts`

# Toolchain

- JavaScript/TypeScript package manager and runner: Bun
- TS lint/format: Biome (`bun run lint:biome`)
- TS type-check: TypeScript compiler (`bun run typecheck:ts`)
- Optional (only when such components exist): uv for Python, cargo for Rust

# Support and Troubleshooting

- Runbooks: `docs/04-ops/runbooks.md`
- Error model: `docs/02-contracts/error-codes.md`
