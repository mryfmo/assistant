# mtls-enforcement-test

- Requirement: `ORCH-SEC-5001`
- Objective: prove non-mTLS workers are rejected in production mode.

## Procedure

1. Configure control plane for production policy.
2. Attempt worker connection without mTLS.
3. Attempt worker connection with valid mTLS credentials.

## Pass Criteria

- Non-mTLS connection is rejected.
- Valid mTLS connection is accepted.
