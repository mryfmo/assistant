# Layout

- `contracts/`: protocol and schema contracts
- `docs/`: governance and implementation documentation
- `playbooks/`: reusable refactoring and memory operation playbooks
- `.opencode/`: project-local OpenCode plugins and skills
- `tests/verification/`: requirement-linked verification artifacts
- `components/`: optional language-specific modules
- `tooling/`: lint/format/type configurations
- `.agent/`: execution plan and completion governance

# Language Placement

- Active implementation: `src/core` (TypeScript)
- `src/core/orchestrator`: workflow orchestration logic
- `src/core/contracts`: TypeScript contract shapes for runtime use
- `src/core/runtime`: runtime policies and environment helpers
- Optional Python components: create `components/python-*` only when required by concrete dependencies
- Optional Rust components: create `components/rust-*` only when native runtime constraints are confirmed

# Current Policy

- Do not create language-specific component directories without a concrete requirement.
- Keep plugin and orchestration logic TypeScript-first for OpenCode/OpenWork compatibility.
