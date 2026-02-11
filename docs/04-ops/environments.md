# Environments

- sandbox: isolated validation environment, reduced trust requirements.
- staging: production-like with strict controls.
- prod: full security and audit controls.

# Differences

- mTLS required in staging/prod.
- unsigned skills allowed only in sandbox.
- external network egress restricted in all environments by policy.
