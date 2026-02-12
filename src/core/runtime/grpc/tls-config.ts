import { readFileSync } from "node:fs";

import * as grpc from "@grpc/grpc-js";

import type { RuntimeConfig } from "../config";

export type MtlsRequirement = "optional" | "required";

function isBunRuntime(): boolean {
  return typeof process.versions.bun === "string";
}

export function usesMetadataMtlsFallback(config: RuntimeConfig): boolean {
  return config.requireMtls && config.allowMtlsMetadataFallback && isBunRuntime();
}

function readPemFile(path: string, fieldName: string): Buffer {
  try {
    return readFileSync(path);
  } catch {
    throw new Error(`Unable to read ${fieldName} at ${path}.`);
  }
}

function requirePath(value: string | undefined, fieldName: string): string {
  if (value === undefined || value.trim().length === 0) {
    throw new Error(`Missing required TLS path: ${fieldName}.`);
  }

  return value;
}

export function mtlsRequirementForEnv(env: RuntimeConfig["env"]): MtlsRequirement {
  return env === "sandbox" ? "optional" : "required";
}

export function createServerCredentials(config: RuntimeConfig): grpc.ServerCredentials {
  if (!config.requireMtls) {
    return grpc.ServerCredentials.createInsecure();
  }

  const caPath = requirePath(config.tlsCaCertPath, "tlsCaCertPath");
  const serverCertPath = requirePath(config.tlsServerCertPath, "tlsServerCertPath");
  const serverKeyPath = requirePath(config.tlsServerKeyPath, "tlsServerKeyPath");

  const ca = readPemFile(caPath, "tlsCaCertPath");
  const certChain = readPemFile(serverCertPath, "tlsServerCertPath");
  const privateKey = readPemFile(serverKeyPath, "tlsServerKeyPath");

  if (usesMetadataMtlsFallback(config)) {
    return grpc.ServerCredentials.createInsecure();
  }

  return grpc.ServerCredentials.createSsl(
    ca,
    [
      {
        cert_chain: certChain,
        private_key: privateKey,
      },
    ],
    true,
  );
}

export function createClientCredentials(config: RuntimeConfig): grpc.ChannelCredentials {
  if (!config.requireMtls) {
    return grpc.credentials.createInsecure();
  }

  const caPath = requirePath(config.tlsCaCertPath, "tlsCaCertPath");
  const clientCertPath = requirePath(config.tlsClientCertPath, "tlsClientCertPath");
  const clientKeyPath = requirePath(config.tlsClientKeyPath, "tlsClientKeyPath");

  const ca = readPemFile(caPath, "tlsCaCertPath");
  const certChain = readPemFile(clientCertPath, "tlsClientCertPath");
  const privateKey = readPemFile(clientKeyPath, "tlsClientKeyPath");

  if (usesMetadataMtlsFallback(config)) {
    return grpc.credentials.createInsecure();
  }

  return grpc.credentials.createSsl(ca, privateKey, certChain);
}
