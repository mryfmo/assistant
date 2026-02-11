# Distributed Orchestration Implementation Plan

This is a living plan. Update `Progress`, `Decision Log`, and `Outcomes` as work advances.

## Purpose

Implement a production-grade orchestration platform where non-technical users can request skill creation and execution through OpenWork, with Plan Agent x1 and Task Execution Agents xN across local and remote workers.

## Progress

- [x] Initialize repository structure and baseline governance docs.
- [x] Define contract-first document tree and acceptance matrix scaffolding.
- [ ] Implement protobuf and JSON schema contract validation automation.
- [ ] Implement orchestrator state machine and worker lease model.
- [ ] Implement skill compiler and sandbox validation pipeline.
- [ ] Implement promotion controls and production policy gates.

## Milestones

1. Documentation and contract pack complete.
2. Contract validation and CI gates complete.
3. Local worker orchestration complete.
4. Remote worker orchestration complete.
5. Sandbox-to-production promotion complete.

## Decision Log

- Decision: Contract-first architecture with protobuf + JSON Schema dual contracts.
  - Rationale: Reduces ambiguity across TypeScript, Python, and Rust implementations.

- Decision: Clarification gate before execution for non-technical UX safety.
  - Rationale: Prevents ambiguous or dangerous side effects.

## Validation

- Validation gates are defined in `docs/00-norms/validation-gates.md`.
- Completion requires all gates G0-G7 to pass.

## Outcomes and Retrospective

Pending implementation.
