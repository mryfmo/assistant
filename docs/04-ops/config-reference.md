# Config Keys

- `ORCH_ENV`: sandbox|staging|prod
- `ORCH_DB_DSN`: database connection string
- `ORCH_LEASE_TTL_SECONDS`: lease ttl
- `ORCH_MAX_RETRY`: max retry count
- `ORCH_REQUIRE_MTLS`: true|false
- `ORCH_ARTIFACT_BACKEND`: local|s3

# Defaults

- sandbox defaults favor safe testing and local artifacts.

# Overrides

- staging/prod overrides MUST be environment-managed and audited.
