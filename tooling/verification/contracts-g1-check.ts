import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { extname, resolve } from "node:path";

import { validateGateTraceability } from "./lib/acceptance-trace";

function assertCondition(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const BUF_CLI_PACKAGE = "@bufbuild/buf@1.58.0";

function runPinnedBufCli(repoRoot: string, args: string[], description: string): void {
  const result = spawnSync("bunx", [BUF_CLI_PACKAGE, ...args], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  assertCondition(
    result.status === 0,
    `${description} failed with status ${result.status ?? "unknown"}`,
  );
}

function readGitStdout(repoRoot: string, args: string[]): string | undefined {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf-8",
  });

  if (result.status !== 0) {
    return undefined;
  }

  const stdout = result.stdout.trim();
  return stdout.length > 0 ? stdout : undefined;
}

function resolvePreChangeBaselineRef(repoRoot: string): string {
  const headSha = readGitStdout(repoRoot, ["rev-parse", "HEAD"]);
  assertCondition(headSha !== undefined, "Unable to resolve HEAD for buf breaking baseline.");

  let originMainSha = readGitStdout(repoRoot, ["rev-parse", "--verify", "origin/main"]);
  if (originMainSha === undefined) {
    const fetchResult = spawnSync("git", ["fetch", "origin", "main", "--depth", "1"], {
      cwd: repoRoot,
      stdio: "inherit",
    });
    assertCondition(
      fetchResult.status === 0,
      `Unable to fetch origin/main for buf breaking baseline (status ${fetchResult.status ?? "unknown"})`,
    );
    originMainSha = readGitStdout(repoRoot, ["rev-parse", "--verify", "origin/main"]);
  }

  const mergeBaseSha = readGitStdout(repoRoot, ["merge-base", "HEAD", "origin/main"]);
  if (mergeBaseSha !== undefined && mergeBaseSha !== headSha) {
    return mergeBaseSha;
  }

  const previousHeadSha = readGitStdout(repoRoot, ["rev-parse", "--verify", "HEAD~1"]);
  if (previousHeadSha !== undefined) {
    return previousHeadSha;
  }

  if (originMainSha !== undefined && originMainSha !== headSha) {
    return originMainSha;
  }

  throw new Error("Unable to resolve pre-change baseline for buf breaking check.");
}

function exportBaselineProtoTree(
  repoRoot: string,
  baselineRef: string,
): { tempRoot: string; baselinePath: string } {
  const tempRoot = mkdtempSync(resolve(tmpdir(), "buf-breaking-"));
  const baselineRoot = resolve(tempRoot, "baseline");
  mkdirSync(baselineRoot, { recursive: true });

  const archiveResult = spawnSync(
    "git",
    ["archive", "--format=tar", baselineRef, "contracts/proto"],
    {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  assertCondition(
    archiveResult.status === 0,
    `Unable to export baseline proto tree from ${baselineRef} (status ${archiveResult.status ?? "unknown"})`,
  );

  const extractResult = spawnSync("tar", ["-xf", "-", "-C", baselineRoot], {
    cwd: repoRoot,
    stdio: ["pipe", "inherit", "inherit"],
    input: archiveResult.stdout,
  });
  assertCondition(
    extractResult.status === 0,
    `Unable to extract baseline proto archive (status ${extractResult.status ?? "unknown"})`,
  );

  const baselinePath = resolve(baselineRoot, "contracts/proto");
  assertCondition(
    existsSync(baselinePath),
    `Extracted baseline proto path missing: ${baselinePath}`,
  );

  return { tempRoot, baselinePath };
}

function collectFiles(path: string, extension: string): string[] {
  const entries = readdirSync(path).sort();
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = resolve(path, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      files.push(...collectFiles(absolutePath, extension));
      continue;
    }

    if (stats.isFile() && extname(absolutePath) === extension) {
      files.push(absolutePath);
    }
  }

  return files;
}

function checkContractInventory(repoRoot: string): void {
  const inventoryContent = readFileSync(
    resolve(repoRoot, "docs/02-contracts/contract-index.md"),
    "utf-8",
  );
  const requiredPaths = [...inventoryContent.matchAll(/`([^`]+)`/g)]
    .map((match) => match[1])
    .filter((entry): entry is string => entry !== undefined && entry.trim().length > 0);

  for (const requiredPath of requiredPaths) {
    if (requiredPath === "contracts/jsonschema/*.v1.json") {
      const schemas = readdirSync(resolve(repoRoot, "contracts/jsonschema")).filter((name) =>
        name.endsWith(".v1.json"),
      );
      assertCondition(
        schemas.length > 0,
        "contracts/jsonschema/*.v1.json does not match any file.",
      );
      continue;
    }

    const absolutePath = resolve(repoRoot, requiredPath);
    assertCondition(existsSync(absolutePath), `Contract inventory path missing: ${requiredPath}`);
  }
}

function checkProtoContracts(repoRoot: string): void {
  const protoFiles = collectFiles(resolve(repoRoot, "contracts/proto"), ".proto");
  assertCondition(protoFiles.length > 0, "No proto files found under contracts/proto.");

  for (const protoFile of protoFiles) {
    const content = readFileSync(protoFile, "utf-8");
    assertCondition(
      content.includes('syntax = "proto3";'),
      `Proto file must declare proto3 syntax: ${protoFile}`,
    );

    const packageMatch = content.match(/^\s*package\s+([a-zA-Z0-9_.]+)\s*;/m);
    assertCondition(packageMatch !== null, `Proto file missing package declaration: ${protoFile}`);

    const versionMatch = protoFile.match(/\/v(\d+)\//);
    assertCondition(
      versionMatch !== null,
      `Proto file path missing version segment /vN/: ${protoFile}`,
    );
    const expectedVersionSuffix = `.v${versionMatch[1]}`;
    assertCondition(
      packageMatch[1].endsWith(expectedVersionSuffix),
      `Proto package version mismatch in ${protoFile}: expected suffix ${expectedVersionSuffix}`,
    );

    const messageBlocks = [...content.matchAll(/message\s+([A-Za-z0-9_]+)\s*\{([\s\S]*?)\n\}/g)];
    for (const block of messageBlocks) {
      const messageName = block[1];
      const body = block[2];
      const fieldNumbers = [...body.matchAll(/=\s*(\d+)\s*;/g)].map((field) =>
        Number.parseInt(field[1], 10),
      );

      const uniqueFieldNumbers = new Set(fieldNumbers);
      assertCondition(
        uniqueFieldNumbers.size === fieldNumbers.length,
        `Proto message has duplicate field numbers: ${messageName} in ${protoFile}`,
      );
      assertCondition(
        fieldNumbers.every((fieldNumber) => Number.isInteger(fieldNumber) && fieldNumber > 0),
        `Proto message has invalid field number in ${messageName} (${protoFile})`,
      );
    }
  }
}

function checkJsonSchemaContracts(repoRoot: string): void {
  const schemaFiles = collectFiles(resolve(repoRoot, "contracts/jsonschema"), ".json");
  assertCondition(schemaFiles.length > 0, "No JSON schema files found under contracts/jsonschema.");

  for (const schemaFile of schemaFiles) {
    assertCondition(
      /\.v\d+\.json$/.test(schemaFile),
      `Schema filename must include major version: ${schemaFile}`,
    );

    const schema = JSON.parse(readFileSync(schemaFile, "utf-8")) as {
      $schema?: unknown;
      $id?: unknown;
    };

    assertCondition(
      typeof schema.$schema === "string",
      `Schema missing $schema field: ${schemaFile}`,
    );
    assertCondition(typeof schema.$id === "string", `Schema missing $id field: ${schemaFile}`);
  }
}

function checkOpenApiContract(repoRoot: string): void {
  const openApiPath = resolve(repoRoot, "contracts/openapi/openapi.yaml");
  assertCondition(
    existsSync(openApiPath),
    "OpenAPI file is missing: contracts/openapi/openapi.yaml",
  );

  const content = readFileSync(openApiPath, "utf-8");
  assertCondition(
    /^openapi:\s*3\./m.test(content),
    "OpenAPI contract must declare OpenAPI 3.x version",
  );
}

function checkProtoCompatibilityTooling(repoRoot: string): void {
  const bufConfigPath = resolve(repoRoot, "tooling/proto/buf.yaml");
  assertCondition(existsSync(bufConfigPath), "Buf config missing: tooling/proto/buf.yaml");

  const content = readFileSync(bufConfigPath, "utf-8");
  assertCondition(content.includes("lint:"), "Buf config must define lint section");
  assertCondition(content.includes("breaking:"), "Buf config must define breaking section");

  runPinnedBufCli(
    repoRoot,
    ["lint", "contracts/proto", "--config", "tooling/proto/buf.yaml"],
    "buf lint",
  );

  const baselineRef = resolvePreChangeBaselineRef(repoRoot);
  const { tempRoot, baselinePath } = exportBaselineProtoTree(repoRoot, baselineRef);

  try {
    runPinnedBufCli(
      repoRoot,
      [
        "breaking",
        "contracts/proto",
        "--config",
        "tooling/proto/buf.yaml",
        "--against",
        baselinePath,
      ],
      "buf breaking",
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

function main(): void {
  const repoRoot = resolve(__dirname, "../..");
  const result = validateGateTraceability(repoRoot, "G1");

  checkContractInventory(repoRoot);
  checkProtoContracts(repoRoot);
  checkJsonSchemaContracts(repoRoot);
  checkOpenApiContract(repoRoot);
  checkProtoCompatibilityTooling(repoRoot);

  process.stdout.write(
    `G1 contracts validation passed for: ${result.validatedRequirementIds.join(", ")}\n`,
  );
}

main();
