import assert from "node:assert/strict";
import test from "node:test";

import { loadRuntimeConfig } from "../../src/core/runtime/config";

test("loadRuntimeConfig uses documented defaults for sandbox", () => {
  const config = loadRuntimeConfig({});

  assert.equal(config.env, "sandbox");
  assert.equal(config.leaseTtlSeconds, 30);
  assert.equal(config.maxRetry, 3);
  assert.equal(config.requireMtls, false);
  assert.equal(config.artifactBackend, "local");
  assert.equal(config.maxActiveWorkflowsPerTenant, 200);
  assert.equal(config.maxTaskPayloadBytes, 512 * 1024);
  assert.equal(config.planStageTimeoutSeconds, 60);
  assert.equal(config.taskExecutionTimeoutSeconds, 300);
});

test("loadRuntimeConfig applies explicit environment overrides", () => {
  const config = loadRuntimeConfig({
    ORCH_ENV: "prod",
    ORCH_DB_DSN: "postgres://db.example/runtime",
    ORCH_LEASE_TTL_SECONDS: "45",
    ORCH_MAX_RETRY: "5",
    ORCH_REQUIRE_MTLS: "true",
    ORCH_ARTIFACT_BACKEND: "s3",
  });

  assert.equal(config.env, "prod");
  assert.equal(config.dbDsn, "postgres://db.example/runtime");
  assert.equal(config.leaseTtlSeconds, 45);
  assert.equal(config.maxRetry, 5);
  assert.equal(config.requireMtls, true);
  assert.equal(config.artifactBackend, "s3");
});

test("loadRuntimeConfig rejects invalid environment values", () => {
  assert.throws(
    () => loadRuntimeConfig({ ORCH_ENV: "qa" }),
    new Error('Invalid ORCH_ENV: expected "sandbox", "staging", or "prod".'),
  );
});
