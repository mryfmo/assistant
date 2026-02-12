# Unit Tests

Validate pure logic and state transitions per component.

# Integration Tests

Validate orchestrator-worker-contract behavior with real contract serialization.

# End-to-End Tests

Validate full flow: intent -> clarification -> plan -> dry-run -> approval -> execute.

# Coverage Expectations

Coverage targets are scoped by gate profile.

## spec-pack Profile (Current)

- Document quality and traceability: validated by G0 gate checks.
- Contract schema structure and compatibility: validated by G1 gate checks.
- Spec consistency assertions (field presence, document content, requirement references): validated by G5/G6 gate checks.
- Runtime logging module (the only implemented runtime code): validated by G7 logging checks with behavioral assertions covering correlation context, redaction, trace linkage, cyclic payloads, and input rejection.
- No unit/integration/E2E test runner is required at this profile level. Test procedures in `tests/verification/*.md` describe validation intent; executable gate scripts in `tooling/verification/*.ts` enforce spec-level checks.

## runtime-implementation Profile (Target)

- Core state machine transitions: 100% branch coverage target.
- Contract adapters: all schema-required fields exercised.
- Worker lease/heartbeat/retry: deterministic behavior validation.
- Clarification gate: live blocking flow validation.
- Promotion controls: live approval/denial path validation.
- A test runner (e.g., `bun test` or `vitest`) MUST be configured and a `test` script MUST be added to `package.json` before this profile is activated.
