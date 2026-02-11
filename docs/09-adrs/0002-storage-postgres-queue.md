# Context

The orchestration layer needs durable state and transactional lease semantics.

# Decision

Use Postgres-backed queue/state model for v1.

# Consequences

Simplifies consistency guarantees; may require tuning under high throughput.

# Alternatives Considered (Closed Set)

- Redis streams
- External queue service
