# 08_security — Security Guardrails

## Security Must Not Regress During Refactoring

- Do not weaken validation boundaries.
- Do not expose secrets in logs or errors.
- Do not widen capability scope accidentally.

## Common Refactor Risks

- Centralized helper that bypasses validation
- Error-wrapper changes that hide actionable security context
- Logging refactor that leaks sensitive payloads

## Required Check

Security-sensitive paths require explicit review notes in PR text.
