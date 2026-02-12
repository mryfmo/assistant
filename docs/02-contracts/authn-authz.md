# Identity Model

Control plane and workers authenticate mutually using mTLS.

## Runtime Compatibility Policy

- `staging` and `prod` readiness requires transport-level mTLS (`grpcs://` with certificate validation).
- Bun runtime currently uses a local compatibility fallback in this repository (`x-mtls-authenticated`, `x-mtls-peer-id`) when grpc-js TLS/h2 transport is unavailable.
- The Bun fallback is accepted for local implementation verification only and MUST NOT be treated as production-readiness evidence.
- Production deployment profile MUST run on a runtime that supports transport-level gRPC mTLS for control-plane traffic.

# Scope Model (Closed Set)

- `plan.read`
- `plan.write`
- `task.dispatch`
- `task.execute`
- `artifact.write`
- `artifact.read`
- `approval.request`
- `approval.consume`

Current runtime-enforced scopes (M5-M11):

- Worker RPC authorization paths enforce `task.dispatch` and `task.execute`.

Planned/future enforcement scope (not yet active):

- `plan.read`, `plan.write`, `artifact.write`, `artifact.read`, `approval.request`, `approval.consume` are reserved in the closed set for future runtime endpoints and are not yet enforced by current implementations.

# Certificate Requirements

- Short-lived certificates (<= 24h)
- Rotated by automated process

# Rotation Rules

- Rotation cannot cause in-flight outage.
- Previous cert remains valid during overlap window.
