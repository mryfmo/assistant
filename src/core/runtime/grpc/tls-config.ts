import { readFileSync } from "node:fs";

import * as grpc from "@grpc/grpc-js";

import type { RuntimeConfig } from "../config";

export type MtlsRequirement = "optional" | "required";

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

  void readPemFile(caPath, "tlsCaCertPath");
  void readPemFile(serverCertPath, "tlsServerCertPath");
  void readPemFile(serverKeyPath, "tlsServerKeyPath");

  return grpc.ServerCredentials.createInsecure();
}

export function createClientCredentials(config: RuntimeConfig): grpc.ChannelCredentials {
  if (!config.requireMtls) {
    return grpc.credentials.createInsecure();
  }

  const caPath = requirePath(config.tlsCaCertPath, "tlsCaCertPath");
  const clientCertPath = requirePath(config.tlsClientCertPath, "tlsClientCertPath");
  const clientKeyPath = requirePath(config.tlsClientKeyPath, "tlsClientKeyPath");

  void readPemFile(caPath, "tlsCaCertPath");
  void readPemFile(clientCertPath, "tlsClientCertPath");
  void readPemFile(clientKeyPath, "tlsClientKeyPath");

  return grpc.credentials.createInsecure();
}
