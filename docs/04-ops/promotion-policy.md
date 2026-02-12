# Promotion Flow

1. sandbox validation
2. staging validation
3. production promotion

Current runtime implementation models three promotion stages only: `sandbox -> staging -> prod`.
Canary/full-rollout slicing is out of scope for the current requirement set.

## Canary Scope

- Canary rollout is out of scope while the current requirement set remains in the `spec-pack` profile.
- Release checklists must treat canary items as conditional when canary rollout becomes active.

# Mandatory Gates

- For spec-pack releases in this repository, all gates in the `spec-pack` profile MUST pass.
- For runtime deployment releases, all gates in the `runtime-implementation` profile (G0-G7) MUST pass.

# Requirements (Traceable)

- ORCH-OPS-6001: Sandbox success MUST precede production promotion.
- ORCH-OPS-6004: Approval and promotion flow MUST block bypass paths.

# Rollback Rule

Rollback is mandatory if error rate exceeds 0.1% for 5 minutes or critical security violation occurs.

# No Bypass Rule

Direct sandbox->prod promotion is forbidden.
