import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { validateGateTraceability } from "./lib/acceptance-trace";

function assertCondition(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function checkRequiredArtifacts(repoRoot: string): void {
  const requiredArtifacts = [
    "docs/01-architecture/security-model.md",
    "docs/02-contracts/authn-authz.md",
    "tests/verification/mtls-enforcement-test.md",
    "tests/verification/logging-correlation-validation.md",
    "tests/verification/logging-redaction-validation.md",
    "tests/verification/logging-trace-context-validation.md",
    "SECURITY.md",
  ];

  for (const requiredArtifact of requiredArtifacts) {
    assertCondition(
      existsSync(resolve(repoRoot, requiredArtifact)),
      `Missing required security artifact: ${requiredArtifact}`,
    );
  }
}

function main(): void {
  const repoRoot = resolve(__dirname, "../..");
  const result = validateGateTraceability(repoRoot, "G7");

  checkRequiredArtifacts(repoRoot);

  const securityModel = readFileSync(
    resolve(repoRoot, "docs/01-architecture/security-model.md"),
    "utf-8",
  );
  assertCondition(
    securityModel.includes("ORCH-SEC-5001"),
    "security-model must include ORCH-SEC-5001",
  );
  assertCondition(
    securityModel.includes("ORCH-SEC-5002"),
    "security-model must include ORCH-SEC-5002",
  );
  assertCondition(securityModel.includes("mTLS"), "security-model must include mTLS requirements");

  const authnAuthz = readFileSync(resolve(repoRoot, "docs/02-contracts/authn-authz.md"), "utf-8");
  assertCondition(
    authnAuthz.includes("mTLS"),
    "authn-authz contract must include mTLS identity model",
  );
  assertCondition(
    authnAuthz.includes("# Scope Model (Closed Set)"),
    "authn-authz contract must include closed-set scope model",
  );

  const loggingCheck = spawnSync("bun", ["run", "check:g7-logging"], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  assertCondition(
    loggingCheck.status === 0,
    `check:g7-logging failed with status ${loggingCheck.status ?? "unknown"}`,
  );

  process.stdout.write(
    `G7 security validation passed for: ${result.validatedRequirementIds.join(", ")}\n`,
  );
}

main();
