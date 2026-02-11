# Acceptance Matrix

| Requirement ID | Statement | Contract(s) | Verification Artifact | Gate(s) | Pass Criteria |
| --- | --- | --- | --- | --- | --- |
| ORCH-CORE-0001 | Immutable `workflow_id` across all events/artifacts | `contracts/proto/orchestrator/v1/orchestrator.proto` | `tests/verification/workflow-correlation-e2e.md` | G5, G6 | All emitted records share one `workflow_id` |
| ORCH-CORE-0002 | Plan Agent has no execution side effects | `contracts/jsonschema/openwork-plan.v1.json` | `tests/verification/plan-agent-no-side-effects-test.md` | G6 | No side-effect task executed in plan stage |
| ORCH-UX-8001 | Clarification gate on ambiguous/high-risk intent | `contracts/jsonschema/openwork-plan.v1.json` | `tests/verification/clarification-gate-e2e.md` | G6 | Blocking clarification appears before execution |
| ORCH-SEC-5001 | mTLS required in production | `docs/02-contracts/authn-authz.md` | `tests/verification/mtls-enforcement-test.md` | G7 | Non-mTLS worker rejected in production mode |
| ORCH-OPS-6001 | Sandbox must pass before prod promotion | `docs/04-ops/promotion-policy.md` | `tests/verification/promotion-policy-integration-test.md` | G6, G7 | Promotion blocked until sandbox evidence is present |
| ORCH-OPS-6002 | Runtime logs include required correlation IDs | `contracts/jsonschema/log-event.v1.json` | `tests/verification/logging-correlation-validation.md` | G7 | `workflow_id`, `task_id`, and `request_id` are always present |
| ORCH-SEC-5002 | Secrets are redacted from runtime logs | `contracts/jsonschema/log-event.v1.json`, `docs/01-architecture/security-model.md` | `tests/verification/logging-redaction-validation.md` | G7 | Secret-like fields are replaced with `[REDACTED]` |
| ORCH-OPS-6003 | Trace-linked logs expose `trace_id` and `span_id` when available | `contracts/jsonschema/log-event.v1.json` | `tests/verification/logging-trace-context-validation.md` | G7 | Log records carry valid trace and span IDs when trace context exists |
