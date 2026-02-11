# Requirement IDs

`ORCH-<DOMAIN>-<NNNN>`

Domains:

- CORE, API, DATA, SKILL, INT, SEC, OPS, DX, UX

# Contract Versioning

- Protobuf package paths are versioned (`/v1`, `/v2`).
- JSON Schemas include version in filename (`*.v1.json`).
- Breaking changes MUST increment major version.

# Release Versioning

- Follow semantic versioning.
- Contract-major updates require major release bump.

# Backward Compatibility Rules

- Additive fields are allowed in same major version.
- Field removal or semantic change requires major version increment.
