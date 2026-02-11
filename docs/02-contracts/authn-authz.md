# Identity Model

Control plane and workers authenticate mutually using mTLS.

# Scope Model (Closed Set)

- `plan.read`
- `plan.write`
- `task.dispatch`
- `task.execute`
- `artifact.write`
- `artifact.read`
- `approval.request`
- `approval.consume`

# Certificate Requirements

- Short-lived certificates (<= 24h)
- Rotated by automated process

# Rotation Rules

- Rotation cannot cause in-flight outage.
- Previous cert remains valid during overlap window.
