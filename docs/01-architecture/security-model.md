# Purpose

Define security controls, trust boundaries, and mandatory protections.

# Scope

AuthN/AuthZ, redaction, secret handling, sandbox isolation.

# Definitions

- Capability: permission scope for side effects.

# Requirements (Traceable)

- ORCH-SEC-5001: Production traffic MUST use mTLS.
- ORCH-SEC-5002: Secrets MUST NOT appear in logs.

# Trust Boundaries

User UI, control plane, worker plane, external SaaS endpoints.

# Authentication (mTLS)

Workers and control plane authenticate with short-lived certs.

# Authorization (Scopes)

Workers receive least-privilege capability tokens per task.

# Redaction Rules

Secrets, credentials, and PII must be masked before persistence.

# Sandbox Isolation Rules

Sandbox runs with restricted network egress and isolated storage.

# Validation

Security tests and policy assertions in G7.

# Failure Modes

Token leakage, privilege escalation, unredacted logs.

# Operational Notes

Rotate certificates and capability signing keys periodically.
