import assert from "node:assert/strict";
import test from "node:test";

import { loadRuntimeConfig } from "../../src/core/runtime/config";

test("loadRuntimeConfig uses documented defaults for sandbox", () => {
  const config = loadRuntimeConfig({});

  assert.equal(config.env, "sandbox");
  assert.equal(config.leaseTtlSeconds, 30);
  assert.equal(config.maxRetry, 3);
  assert.equal(config.requireMtls, false);
  assert.equal(config.allowMtlsMetadataFallback, true);
  assert.equal(config.artifactBackend, "local");
  assert.equal(config.maxActiveWorkflowsPerTenant, 200);
  assert.equal(config.maxTaskPayloadBytes, 512 * 1024);
  assert.equal(config.planStageTimeoutSeconds, 60);
  assert.equal(config.taskExecutionTimeoutSeconds, 300);
  assert.equal(config.tlsCaCertPath, undefined);
  assert.equal(config.tlsServerCertPath, undefined);
  assert.equal(config.tlsServerKeyPath, undefined);
  assert.equal(config.tlsClientCertPath, undefined);
  assert.equal(config.tlsClientKeyPath, undefined);
});

test("loadRuntimeConfig applies explicit environment overrides", () => {
  const config = loadRuntimeConfig({
    ORCH_ENV: "prod",
    ORCH_DB_DSN: "postgres://db.example/runtime",
    ORCH_LEASE_TTL_SECONDS: "45",
    ORCH_MAX_RETRY: "5",
    ORCH_REQUIRE_MTLS: "true",
    ORCH_ALLOW_MTLS_METADATA_FALLBACK: "false",
    ORCH_ARTIFACT_BACKEND: "s3",
    ORCH_MAX_ACTIVE_WORKFLOWS_PER_TENANT: "150",
    ORCH_TLS_CA_CERT_PATH: "/tmp/ca.pem",
    ORCH_TLS_SERVER_CERT_PATH: "/tmp/server-cert.pem",
    ORCH_TLS_SERVER_KEY_PATH: "/tmp/server-key.pem",
    ORCH_TLS_CLIENT_CERT_PATH: "/tmp/client-cert.pem",
    ORCH_TLS_CLIENT_KEY_PATH: "/tmp/client-key.pem",
  });

  assert.equal(config.env, "prod");
  assert.equal(config.dbDsn, "postgres://db.example/runtime");
  assert.equal(config.leaseTtlSeconds, 45);
  assert.equal(config.maxRetry, 5);
  assert.equal(config.requireMtls, true);
  assert.equal(config.allowMtlsMetadataFallback, false);
  assert.equal(config.artifactBackend, "s3");
  assert.equal(config.maxActiveWorkflowsPerTenant, 150);
  assert.equal(config.tlsCaCertPath, "/tmp/ca.pem");
  assert.equal(config.tlsServerCertPath, "/tmp/server-cert.pem");
  assert.equal(config.tlsServerKeyPath, "/tmp/server-key.pem");
  assert.equal(config.tlsClientCertPath, "/tmp/client-cert.pem");
  assert.equal(config.tlsClientKeyPath, "/tmp/client-key.pem");
});

test("loadRuntimeConfig rejects invalid environment values", () => {
  assert.throws(
    () => loadRuntimeConfig({ ORCH_ENV: "qa" }),
    new Error('Invalid ORCH_ENV: expected "sandbox", "staging", or "prod".'),
  );
});

test("loadRuntimeConfig enforces mTLS in staging and prod", () => {
  assert.throws(
    () =>
      loadRuntimeConfig({
        ORCH_ENV: "staging",
        ORCH_REQUIRE_MTLS: "false",
      }),
    new Error("Invalid ORCH_REQUIRE_MTLS: staging/prod require mTLS."),
  );
});

test("loadRuntimeConfig rejects invalid runtime limit overrides", () => {
  assert.throws(
    () =>
      loadRuntimeConfig({
        ORCH_MAX_ACTIVE_WORKFLOWS_PER_TENANT: "0",
      }),
    new Error("Invalid ORCH_MAX_ACTIVE_WORKFLOWS_PER_TENANT: expected a positive integer."),
  );
});
