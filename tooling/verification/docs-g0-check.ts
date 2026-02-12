import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";

import { validateGateTraceability } from "./lib/acceptance-trace";

function assertCondition(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function collectMarkdownFiles(path: string): string[] {
  const entries = readdirSync(path).sort();
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = resolve(path, entry);
    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      files.push(...collectMarkdownFiles(absolutePath));
      continue;
    }
    if (stats.isFile() && extname(absolutePath) === ".md") {
      files.push(absolutePath);
    }
  }

  return files;
}

function parseBacktickedPaths(content: string): string[] {
  return [...content.matchAll(/`([^`]+)`/g)]
    .map((match) => match[1])
    .filter((path): path is string => path !== undefined && path.trim().length > 0);
}

function checkContractInventory(repoRoot: string): void {
  const inventoryContent = readFileSync(
    resolve(repoRoot, "docs/02-contracts/contract-index.md"),
    "utf-8",
  );
  const inventoryPaths = parseBacktickedPaths(inventoryContent);

  assertCondition(inventoryPaths.length > 0, "Contract inventory does not list any paths.");

  for (const inventoryPath of inventoryPaths) {
    if (inventoryPath.includes("*")) {
      if (inventoryPath === "contracts/jsonschema/*.v1.json") {
        const schemaDir = resolve(repoRoot, "contracts/jsonschema");
        const schemaFiles = readdirSync(schemaDir).filter((fileName) =>
          fileName.endsWith(".v1.json"),
        );
        assertCondition(
          schemaFiles.length > 0,
          "Contract inventory wildcard contracts/jsonschema/*.v1.json does not match any files.",
        );
        continue;
      }

      throw new Error(`Unsupported wildcard path in contract inventory: ${inventoryPath}`);
    }

    const absolutePath = resolve(repoRoot, inventoryPath);
    assertCondition(
      existsSync(absolutePath),
      `Contract inventory path does not exist: ${inventoryPath}`,
    );
  }
}

function checkMarkdownLintAndLinks(repoRoot: string): void {
  const markdownRoots = [
    resolve(repoRoot, "README.md"),
    resolve(repoRoot, "docs"),
    resolve(repoRoot, "checklists"),
    resolve(repoRoot, "tests/verification"),
  ];

  const markdownFiles = markdownRoots.flatMap((path) => {
    if (!existsSync(path)) {
      return [];
    }

    const stats = statSync(path);
    if (stats.isDirectory()) {
      return collectMarkdownFiles(path);
    }

    if (stats.isFile() && extname(path) === ".md") {
      return [path];
    }

    return [];
  });

  const prohibitedPhrases = [
    "Do as needed",
    "Handle appropriately",
    "Support future cases",
    "Implementation detail",
  ];

  for (const markdownFile of markdownFiles) {
    const content = readFileSync(markdownFile, "utf-8");
    const relativePath = markdownFile.replace(`${repoRoot}/`, "");

    assertCondition(
      /(^|\n)#\s+.+/.test(content),
      `Markdown file is missing an H1 heading: ${relativePath}`,
    );

    if (!relativePath.endsWith("docs/00-norms/anti-ambiguity.md")) {
      for (const phrase of prohibitedPhrases) {
        assertCondition(
          !content.includes(phrase),
          `Prohibited ambiguity phrase found in ${relativePath}: \"${phrase}\"`,
        );
      }
    }

    const links = [...content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)]
      .map((match) => match[1])
      .filter((target): target is string => target !== undefined && target.trim().length > 0);

    for (const linkTarget of links) {
      if (
        linkTarget.startsWith("http://") ||
        linkTarget.startsWith("https://") ||
        linkTarget.startsWith("mailto:") ||
        linkTarget.startsWith("#")
      ) {
        continue;
      }

      const cleanedTarget = linkTarget.split("#")[0].trim();
      if (cleanedTarget.length === 0) {
        continue;
      }

      const absoluteTarget = cleanedTarget.startsWith("/")
        ? resolve(repoRoot, cleanedTarget.slice(1))
        : resolve(dirname(markdownFile), cleanedTarget);

      assertCondition(
        existsSync(absoluteTarget),
        `Broken local markdown link in ${relativePath}: ${linkTarget}`,
      );
    }
  }
}

function checkExecutionPlanRequirementMapping(repoRoot: string): void {
  const requirementsContent = readFileSync(
    resolve(repoRoot, "docs/06-acceptance/requirements.yaml"),
    "utf-8",
  );
  const requirementIds = new Set(
    [...requirementsContent.matchAll(/^\s*-\s+id:\s+([A-Z0-9-]+)\s*$/gm)]
      .map((match) => match[1])
      .filter((id): id is string => id !== undefined),
  );

  const executionPlanContent = readFileSync(
    resolve(repoRoot, "docs/08-execution/execution-plan.md"),
    "utf-8",
  );
  const executionPlanLines = executionPlanContent.split("\n");

  const stepLines = executionPlanLines.filter((line) => /^\s*[3-6]\.\s/.test(line));
  assertCondition(
    stepLines.length === 4,
    "Execution plan must define exactly steps 3-6 for implementation mapping.",
  );

  for (const stepLine of stepLines) {
    const requirementIdMatch = stepLine.match(/`(ORCH-[A-Z]+-[0-9]{4})`/);
    assertCondition(
      requirementIdMatch !== null,
      `Execution plan step is missing requirement ID mapping: ${stepLine.trim()}`,
    );

    const requirementId = requirementIdMatch[1];
    assertCondition(
      requirementIds.has(requirementId),
      `Execution plan references unknown requirement ID: ${requirementId}`,
    );
  }
}

function main(): void {
  const repoRoot = resolve(__dirname, "../..");
  const result = validateGateTraceability(repoRoot, "G0");

  checkContractInventory(repoRoot);
  checkMarkdownLintAndLinks(repoRoot);
  checkExecutionPlanRequirementMapping(repoRoot);

  process.stdout.write(
    `G0 docs validation passed for: ${result.validatedRequirementIds.join(", ")}\n`,
  );
}

main();
