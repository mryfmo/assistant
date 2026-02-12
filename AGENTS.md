# Roles

This repository defines implementation contracts for:

- Plan Agent (single coordinator)
- Task Execution Agent (horizontal workers)
- Skill Compiler
- Validation Agent

All behavior MUST follow requirement IDs in `docs/06-acceptance/requirements.yaml`.

# Tooling Boundaries and Allowed Side Effects

- Plan Agent: no external side effects; planning and decomposition only.
- Task Execution Agents: side effects allowed only within approved capabilities and environment policy.
- Chrome/Playwright tasks: sandbox-first, explicit promotion required.

# Plan Agent Responsibilities

- Build deterministic task graph with dependency edges.
- Emit `SkillSpec` and clarification requests for ambiguous/risky intent.
- Never execute production side effects.

# Task Execution Agent Responsibilities

- Lease task, execute capability-scoped work, emit structured events.
- Respect cancellation, timeout, retry, and idempotency contracts.
- Store artifacts and return typed results.

# Skills Runtime Responsibilities

- Load and validate generated skill artifacts.
- Enforce skill manifest compatibility and permission policy.
- Reject malformed or unsigned artifacts in non-sandbox environments.

# Chrome Integration Responsibilities

- Implement browser steps through `contracts/jsonschema/task-spec.v1.json` and `contracts/jsonschema/task-result.v1.json`.
- Capture screenshots and traces for dry-run proof.
- Block navigation outside approved URL allowlist.

# Non-Technical User Clarification Protocol

- Ask one question at a time.
- Use plain language, no implementation jargon. For this repo session, chat responses are in Japanese by default, while technical code/docs remain English unless explicitly requested.
- Include one recommended default and a one-sentence consequence.
- Stop execution until blocking clarifications are resolved.

# Logging, Redaction, and Artifact Rules

- All logs MUST include `workflow_id`, `task_id`, `request_id`.
- Secrets and credentials MUST be redacted.
- Artifacts MUST be content-addressed and audit-linked.

# Failure Handling and Retries

- Retryable errors follow policy in `docs/02-contracts/error-codes.md`.
- Non-retryable errors route to user-facing clarification or incident runbook.
- Duplicate task execution is prevented by idempotency key and lease rules.

# Refactoring Protocol

- For refactoring work, follow `playbooks/refactoring/AGENTS.md`.
- Use workflow and verification docs under `playbooks/refactoring/docs/`.
- Keep refactoring changes behavior-preserving unless requirements explicitly change.

# Memory Protocol

- Session start SHOULD run `memory({ mode: "profile" })` (equivalent skill: `memory-bootstrap`).
- Durable findings SHOULD be persisted via `memory({ mode: "add", ... })` (equivalent skill: `memory-add`).
- Milestone boundaries SHOULD run `memory({ mode: "capture-now" })` (equivalent skill: `memory-capture-now`).
- Session end SHOULD run `session-handoff` when work remains.
- Never persist secrets in memory entries.
