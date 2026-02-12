import { resolve } from "node:path";

import type { RuntimeConfig } from "../../src/core/runtime/config";

export function fixturePath(name: string): string {
  return resolve(process.cwd(), "tests/fixtures/mtls", name);
}

export function createMtlsConfig(input: {
  env: RuntimeConfig["env"];
  requireMtls?: boolean;
  allowMtlsMetadataFallback?: boolean;
}): RuntimeConfig {
  const requireMtls = input.requireMtls ?? true;
  const allowMtlsMetadataFallback = input.allowMtlsMetadataFallback ?? true;

  return {
    env: input.env,
    dbDsn: undefined,
    leaseTtlSeconds: 30,
    maxRetry: 3,
    requireMtls,
    allowMtlsMetadataFallback,
    artifactBackend: "local",
    maxActiveWorkflowsPerTenant: 200,
    maxTaskPayloadBytes: 512 * 1024,
    planStageTimeoutSeconds: 60,
    taskExecutionTimeoutSeconds: 300,
    tlsCaCertPath: fixturePath("ca-cert.pem"),
    tlsServerCertPath: fixturePath("server-cert.pem"),
    tlsServerKeyPath: fixturePath("server-key.pem"),
    tlsClientCertPath: fixturePath("client-cert.pem"),
    tlsClientKeyPath: fixturePath("client-key.pem"),
  };
}
