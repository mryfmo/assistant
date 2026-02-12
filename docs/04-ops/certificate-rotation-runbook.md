# Purpose

Define deterministic certificate rotation steps for orchestrator and worker mTLS endpoints.

# Scope

- Control plane gRPC endpoints
- Worker gRPC clients and credentials
- Certificate authority trust bundle updates

# Preconditions

1. New server/client certificates are issued from approved CA.
2. New certificate expiry is validated to be within policy (<= 24h in production).
3. Rollback bundle (previous cert/key/CA) is retained and encrypted.

# Rotation Procedure

1. Stage new CA bundle and leaf certificates on all runtime nodes.
2. Update runtime config paths:
   - `ORCH_TLS_CA_CERT_PATH`
   - `ORCH_TLS_SERVER_CERT_PATH`
   - `ORCH_TLS_SERVER_KEY_PATH`
   - `ORCH_TLS_CLIENT_CERT_PATH`
   - `ORCH_TLS_CLIENT_KEY_PATH`
3. Restart orchestrator network listeners with overlap window active.
4. Restart remote worker clients and confirm successful authenticated gRPC calls.
5. Verify mTLS enforcement tests and connection logs show authenticated peers.
6. Remove old certificates after overlap window closes.

# Validation

- `tests/runtime/mtls-enforcement.integration.test.ts` passes.
- `tests/runtime/mtls-matrix.integration.test.ts` passes.
- No unauthorized mTLS handshake failures in rollout window.

# Rollback

1. Restore previous certificate bundle paths.
2. Restart orchestrator listeners and worker clients.
3. Confirm remote dispatch succeeds and mTLS auth errors clear.
4. File incident record if rollback was required.

# Traceability

- Requirement: `ORCH-SEC-5001`
- Verification Artifact: `tests/verification/mtls-enforcement-test.md`
