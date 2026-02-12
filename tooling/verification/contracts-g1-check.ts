import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";

import { validateGateTraceability } from "./lib/acceptance-trace";

function assertCondition(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
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

  const lintResult = spawnSync(
    "bunx",
    ["@bufbuild/buf", "lint", "contracts/proto", "--config", "tooling/proto/buf.yaml"],
    {
      cwd: repoRoot,
      stdio: "inherit",
    },
  );

  assertCondition(
    lintResult.status === 0,
    `buf lint failed with status ${lintResult.status ?? "unknown"}`,
  );

  const hasOriginMain = spawnSync("git", ["rev-parse", "--verify", "origin/main"], {
    cwd: repoRoot,
    stdio: "ignore",
  });

  if (hasOriginMain.status !== 0) {
    const fetchResult = spawnSync("git", ["fetch", "origin", "main", "--depth", "1"], {
      cwd: repoRoot,
      stdio: "inherit",
    });
    assertCondition(
      fetchResult.status === 0,
      `Unable to fetch origin/main for buf breaking baseline (status ${fetchResult.status ?? "unknown"})`,
    );
  }

  const breakingResult = spawnSync(
    "bunx",
    [
      "@bufbuild/buf",
      "breaking",
      "contracts/proto",
      "--config",
      "tooling/proto/buf.yaml",
      "--against",
      ".git#branch=origin/main,subdir=contracts/proto",
    ],
    {
      cwd: repoRoot,
      stdio: "inherit",
    },
  );

  assertCondition(
    breakingResult.status === 0,
    `buf breaking failed with status ${breakingResult.status ?? "unknown"}`,
  );
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
