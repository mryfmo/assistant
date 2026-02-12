# Directory Policy

Each verification artifact maps directly to requirement IDs in `docs/06-acceptance/requirements.yaml`.

Under the `spec-pack` profile, these artifacts are specification-level intent documents that describe test procedures and pass criteria. They are validated for existence, format, and requirement-ID linkage by gate scripts in `tooling/verification/*.ts`. They are not themselves executable tests.

Under the `runtime-implementation` profile, each artifact MUST have a corresponding executable test that implements its procedure and validates its pass criteria.
