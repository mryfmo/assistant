# Purpose

Define the end-to-end orchestration behavior for distributed execution.

# Scope

Includes local and remote worker orchestration, skill compilation, sandbox validation, and production promotion.

# Definitions

- Workflow: end-to-end execution for one user request.
- Plan graph: dependency graph from Plan Agent.
- Task: executable unit leased by workers.

# Requirements (Traceable)

- ORCH-CORE-0001: Workflow MUST carry immutable `workflow_id`.
- ORCH-CORE-0002: Plan Agent MUST NOT execute side effects.

# Interfaces / Contracts

- `contracts/proto/orchestrator/v1/orchestrator.proto`
- `contracts/jsonschema/openwork-plan.v1.json`

# End-to-End Sequence (Happy Path)

Intent -> Clarification (when intent is ambiguous or high-risk) -> Plan -> Compile -> Sandbox Dry-run -> Approval -> Dispatch -> Execute -> Artifact/Audit.

# End-to-End Sequence (Failure + Retry)

Retryable failure -> backoff retry within policy -> terminal failure emits incident event and user summary.

# Cancellation Sequence

Cancel request marks workflow canceling -> in-flight tasks receive cancel signal -> final state `cancelled`.

# Validation

Validated by G5/G6 scenarios and acceptance matrix entries.

# Failure Modes

Lease expiry, worker crash, contract mismatch, policy denial.

# Operational Notes

Production requires mTLS and signed skill manifests.
