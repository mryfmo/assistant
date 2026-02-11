# Purpose

Define generated skill artifact lifecycle and runtime behavior.

# Contract(s)

- `contracts/jsonschema/skill-manifest.v1.json`

# Required Behaviors

- Skills MUST include valid manifest and conforming `.opencode/skills/*/SKILL.md` metadata.
- Skill loading MUST be blocked if permissions violate policy.

# Failure Modes

Invalid manifest, missing capability scope.

# Validation (Tests + Gates)

Contract validation in G1 and runtime checks in G5.
