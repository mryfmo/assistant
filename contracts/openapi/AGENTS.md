# Directory Policy

OpenAPI definitions are the external control-plane HTTP surface.

Internal worker-plane transport is defined by protobuf contracts under `contracts/proto/**`.

Field semantics shared between surfaces MUST remain consistent.
