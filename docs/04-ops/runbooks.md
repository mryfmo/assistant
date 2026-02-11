# Worker Fleet Unhealthy

1. Check worker heartbeat stream.
2. Drain failed workers.
3. Rebalance leases.

# Task Backlog Growth

1. Inspect queue depth and dispatch latency.
2. Scale workers or apply load shedding.

# Lease Storm / Duplicate Work

1. Verify lease TTL and heartbeat consistency.
2. Enforce idempotency key lock.

# Artifact Upload Failures

1. Validate storage backend health.
2. Retry upload using exponential backoff.

# Certificate Rotation

1. Issue new cert bundle.
2. Roll workers gradually.
3. Revoke expired certs.
