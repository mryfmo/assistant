# Context

Distributed workers require strongly typed transport and strong identity guarantees.

# Decision

Use gRPC over mTLS for control-plane to worker communication.

# Consequences

Improved interoperability and secure mutual authentication; requires certificate lifecycle management.

# Alternatives Considered (Closed Set)

- HTTP/JSON with bearer token
- Message queue only
