# Context

Distributed execution can produce duplicate deliveries and retries.

# Decision

Adopt at-least-once delivery with strict idempotency keys for side effects.

# Consequences

Improves resilience while requiring idempotency-aware task handlers.

# Alternatives Considered (Closed Set)

- Exactly-once semantics
- At-most-once semantics
