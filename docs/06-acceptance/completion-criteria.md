# Completion Criteria

v1 is complete only if all conditions below are satisfied.

1. All gates in the `spec-pack` profile pass in CI.
2. Plan Agent x1 and Task Execution Agents xN run in local and remote topology.
3. Clarification gate is enforced for ambiguous/high-risk user requests.
4. Sandbox dry-run evidence is generated and required before production promotion.
5. Contract compatibility checks pass for protobuf and JSON schema artifacts.
6. Security controls (mTLS, redaction, capability scope) are verified.

For runtime deployment releases, the `runtime-implementation` profile applies and requires executable G0-G7 runtime checks.
