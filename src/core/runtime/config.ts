import type { RuntimeMode } from "./index";

export type ArtifactBackend = "local" | "s3";

export type RuntimeConfig = {
  env: RuntimeMode;
  dbDsn?: string;
  leaseTtlSeconds: number;
  maxRetry: number;
  requireMtls: boolean;
  artifactBackend: ArtifactBackend;
  maxActiveWorkflowsPerTenant: number;
  maxTaskPayloadBytes: number;
  planStageTimeoutSeconds: number;
  taskExecutionTimeoutSeconds: number;
  tlsCaCertPath?: string;
  tlsServerCertPath?: string;
  tlsServerKeyPath?: string;
  tlsClientCertPath?: string;
  tlsClientKeyPath?: string;
  allowMtlsMetadataFallback: boolean;
};

const DEFAULTS = {
  leaseTtlSeconds: 30,
  maxRetry: 3,
  maxActiveWorkflowsPerTenant: 200,
  maxTaskPayloadBytes: 512 * 1024,
  planStageTimeoutSeconds: 60,
  taskExecutionTimeoutSeconds: 300,
} as const;

function assertNonEmptyString(value: string, key: string): void {
  if (value.trim().length === 0) {
    throw new Error(`Invalid ${key}: value must be a non-empty string.`);
  }
}

function parsePositiveInt(rawValue: string | undefined, key: string, fallback: number): number {
  if (rawValue === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${key}: expected a positive integer.`);
  }

  return parsed;
}

function parseBoolean(rawValue: string | undefined, key: string, fallback: boolean): boolean {
  if (rawValue === undefined) {
    return fallback;
  }

  if (rawValue === "true") {
    return true;
  }

  if (rawValue === "false") {
    return false;
  }

  throw new Error(`Invalid ${key}: expected "true" or "false".`);
}

function parseRuntimeMode(rawValue: string | undefined): RuntimeMode {
  if (rawValue === undefined) {
    return "sandbox";
  }

  if (rawValue !== "sandbox" && rawValue !== "staging" && rawValue !== "prod") {
    throw new Error('Invalid ORCH_ENV: expected "sandbox", "staging", or "prod".');
  }

  return rawValue;
}

function parseArtifactBackend(rawValue: string | undefined, env: RuntimeMode): ArtifactBackend {
  if (rawValue === undefined) {
    return env === "sandbox" ? "local" : "s3";
  }

  if (rawValue === "local" || rawValue === "s3") {
    return rawValue;
  }

  throw new Error('Invalid ORCH_ARTIFACT_BACKEND: expected "local" or "s3".');
}

export function loadRuntimeConfig(
  environment: Record<string, string | undefined> = process.env,
): RuntimeConfig {
  const env = parseRuntimeMode(environment.ORCH_ENV);
  const requireMtlsDefault = env === "staging" || env === "prod";
  const dbDsn = environment.ORCH_DB_DSN;

  if (dbDsn !== undefined) {
    assertNonEmptyString(dbDsn, "ORCH_DB_DSN");
  }

  const tlsCaCertPath = environment.ORCH_TLS_CA_CERT_PATH;
  const tlsServerCertPath = environment.ORCH_TLS_SERVER_CERT_PATH;
  const tlsServerKeyPath = environment.ORCH_TLS_SERVER_KEY_PATH;
  const tlsClientCertPath = environment.ORCH_TLS_CLIENT_CERT_PATH;
  const tlsClientKeyPath = environment.ORCH_TLS_CLIENT_KEY_PATH;

  if (tlsCaCertPath !== undefined) {
    assertNonEmptyString(tlsCaCertPath, "ORCH_TLS_CA_CERT_PATH");
  }
  if (tlsServerCertPath !== undefined) {
    assertNonEmptyString(tlsServerCertPath, "ORCH_TLS_SERVER_CERT_PATH");
  }
  if (tlsServerKeyPath !== undefined) {
    assertNonEmptyString(tlsServerKeyPath, "ORCH_TLS_SERVER_KEY_PATH");
  }
  if (tlsClientCertPath !== undefined) {
    assertNonEmptyString(tlsClientCertPath, "ORCH_TLS_CLIENT_CERT_PATH");
  }
  if (tlsClientKeyPath !== undefined) {
    assertNonEmptyString(tlsClientKeyPath, "ORCH_TLS_CLIENT_KEY_PATH");
  }

  const requireMtls = parseBoolean(
    environment.ORCH_REQUIRE_MTLS,
    "ORCH_REQUIRE_MTLS",
    requireMtlsDefault,
  );
  const allowMtlsMetadataFallback = parseBoolean(
    environment.ORCH_ALLOW_MTLS_METADATA_FALLBACK,
    "ORCH_ALLOW_MTLS_METADATA_FALLBACK",
    true,
  );

  const maxActiveWorkflowsPerTenant = parsePositiveInt(
    environment.ORCH_MAX_ACTIVE_WORKFLOWS_PER_TENANT,
    "ORCH_MAX_ACTIVE_WORKFLOWS_PER_TENANT",
    DEFAULTS.maxActiveWorkflowsPerTenant,
  );

  if (env !== "sandbox" && !requireMtls) {
    throw new Error("Invalid ORCH_REQUIRE_MTLS: staging/prod require mTLS.");
  }

  return {
    env,
    dbDsn,
    leaseTtlSeconds: parsePositiveInt(
      environment.ORCH_LEASE_TTL_SECONDS,
      "ORCH_LEASE_TTL_SECONDS",
      DEFAULTS.leaseTtlSeconds,
    ),
    maxRetry: parsePositiveInt(environment.ORCH_MAX_RETRY, "ORCH_MAX_RETRY", DEFAULTS.maxRetry),
    requireMtls,
    allowMtlsMetadataFallback,
    artifactBackend: parseArtifactBackend(environment.ORCH_ARTIFACT_BACKEND, env),
    maxActiveWorkflowsPerTenant,
    maxTaskPayloadBytes: DEFAULTS.maxTaskPayloadBytes,
    planStageTimeoutSeconds: DEFAULTS.planStageTimeoutSeconds,
    taskExecutionTimeoutSeconds: DEFAULTS.taskExecutionTimeoutSeconds,
    tlsCaCertPath,
    tlsServerCertPath,
    tlsServerKeyPath,
    tlsClientCertPath,
    tlsClientKeyPath,
  };
}
