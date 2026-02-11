# promotion-policy-integration-test

- Requirement: `ORCH-OPS-6001`
- Objective: prove promotion is blocked until sandbox evidence exists.

## Procedure

1. Attempt promotion without sandbox evidence.
2. Record decision result.
3. Add sandbox verification evidence.
4. Re-attempt promotion.

## Pass Criteria

- First promotion attempt is denied.
- Second attempt is accepted only after required evidence is present.
