# Error Envelope

All APIs return a typed envelope containing:

- `code`
- `message`
- `retryable`
- `request_id`

# Error Codes (Closed Set)

- `INVALID_REQUEST`
- `CONTRACT_MISMATCH`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `LEASE_CONFLICT`
- `TASK_TIMEOUT`
- `DEPENDENCY_FAILURE`
- `POLICY_DENIED`
- `INTERNAL_ERROR`

# Retryability Rules

- Retryable: lease conflict, dependency transient, timeout (policy-based).
- Non-retryable: invalid request, forbidden, policy denied.

# Redaction Requirements

Error messages MUST redact secrets and PII.
