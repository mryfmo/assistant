# Contract Inventory

- Protobuf: `contracts/proto/orchestrator/v1/orchestrator.proto`
- Protobuf: `contracts/proto/skills/v1/skills.proto`
- JSON Schema: `contracts/jsonschema/*.v1.json`
- OpenAPI (external HTTP subset): `contracts/openapi/openapi.yaml`

# Surface Split

- OpenAPI: external control-plane HTTP endpoints.
- Protobuf: internal worker-plane service contracts.
- JSON Schema: payload shape constraints shared across adapters and docs.

# Compatibility Rules

- Additive changes only within major version.
- Breaking changes require new major version path/file.

# Contract Test Vectors

Contract test vectors are maintained alongside implementation tests and referenced by requirement IDs.
