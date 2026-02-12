export type RuntimeMode = "sandbox" | "staging" | "prod";

export function isRuntimeMode(value: string): value is RuntimeMode {
  return value === "sandbox" || value === "staging" || value === "prod";
}

export * from "./config";
export * from "./grpc/index";
export * from "./logging/index";
