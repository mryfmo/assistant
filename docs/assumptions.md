# Assumptions (Locked for v1)

- OpenWork acts as orchestration control plane UI and policy gateway.
- OpenCode acts as execution/runtime substrate.
- OhMyOpenCode agent profiles are available for role presets.
- Remote workers are reachable over authenticated network links.
- Sandbox environment supports Playwright-based browser automation.

# Non-Goals (Locked for v1)

- Fully autonomous production execution without approvals.
- Unlimited third-party SaaS adapters in v1.
- Real-time collaborative multi-editor workflow design.

# Escalation Triggers (When to Revisit)

- Security incidents involving secret leakage.
- Contract incompatibility across language implementations.
- Sustained SLO breach over defined thresholds.
