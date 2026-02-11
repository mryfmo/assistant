# Promotion Flow

1. sandbox validation
2. staging validation
3. production canary
4. production full rollout

# Mandatory Gates

- For spec-pack releases in this repository, all gates in the `spec-pack` profile MUST pass.
- For runtime deployment releases, all gates in the `runtime-implementation` profile (G0-G7) MUST pass.

# Rollback Rule

Rollback is mandatory if error rate exceeds 0.1% for 5 minutes or critical security violation occurs.

# No Bypass Rule

Direct sandbox->prod promotion is forbidden.
