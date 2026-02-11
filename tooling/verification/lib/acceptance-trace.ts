import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export type RequirementRecord = {
  id: string;
  gates: string[];
  verifications: string[];
};

export type AcceptanceMatrixRecord = {
  id: string;
  gates: string[];
  verifications: string[];
};

export type GateTraceValidationResult = {
  gate: string;
  validatedRequirementIds: string[];
};

function assertCondition(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeList(values: string[]): string[] {
  return [
    ...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)),
  ].sort();
}

function parseBracketList(value: string): string[] {
  const quotedValues = [...value.matchAll(/"([^"]+)"/g)]
    .map((match) => match[1])
    .filter((entry): entry is string => entry !== undefined && entry.trim().length > 0);

  if (quotedValues.length > 0) {
    return normalizeList(quotedValues);
  }

  return normalizeList(
    value
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .split(",")
      .map((entry) => entry.replace(/^["']|["']$/g, "").trim()),
  );
}

function parseVerificationIdsFromMatrixCell(cell: string): string[] {
  const matched = [...cell.matchAll(/`([^`]+)`/g)]
    .map((match) => match[1])
    .filter((entry): entry is string => entry !== undefined && entry.trim().length > 0);

  if (matched.length > 0) {
    return normalizeList(matched);
  }

  return normalizeList([cell]);
}

function parseRequirementHeader(content: string, filePath: string): string {
  const headerMatch = content.match(/-\s*Requirement:\s*`([A-Z0-9-]+)`/);
  assertCondition(
    headerMatch !== null,
    `Verification artifact missing requirement header: ${filePath}`,
  );
  return headerMatch[1];
}

function sameSet(left: string[], right: string[]): boolean {
  const normalizedLeft = normalizeList(left);
  const normalizedRight = normalizeList(right);

  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

export function parseRequirementsYaml(content: string): RequirementRecord[] {
  const requirements: RequirementRecord[] = [];
  const seenIds = new Set<string>();

  let currentId: string | undefined;
  let currentGates: string[] = [];
  let currentVerifications: string[] = [];

  const flushCurrent = (): void => {
    if (currentId === undefined) {
      return;
    }

    assertCondition(currentGates.length > 0, `Requirement ${currentId} is missing gate list.`);
    assertCondition(
      currentVerifications.length > 0,
      `Requirement ${currentId} is missing verification list.`,
    );
    assertCondition(!seenIds.has(currentId), `Duplicate requirement id found: ${currentId}`);

    seenIds.add(currentId);
    requirements.push({
      id: currentId,
      gates: normalizeList(currentGates),
      verifications: normalizeList(currentVerifications),
    });

    currentId = undefined;
    currentGates = [];
    currentVerifications = [];
  };

  for (const line of content.split("\n")) {
    const idMatch = line.match(/^\s*-\s+id:\s+([A-Z0-9-]+)\s*$/);
    if (idMatch !== null) {
      flushCurrent();
      currentId = idMatch[1];
      continue;
    }

    if (currentId === undefined) {
      continue;
    }

    const gateMatch = line.match(/^\s*gate:\s*\[(.*)\]\s*$/);
    if (gateMatch !== null) {
      currentGates = parseBracketList(gateMatch[1]);
      continue;
    }

    const verificationMatch = line.match(/^\s*verification:\s*\[(.*)\]\s*$/);
    if (verificationMatch !== null) {
      currentVerifications = parseBracketList(verificationMatch[1]);
    }
  }

  flushCurrent();

  assertCondition(requirements.length > 0, "No requirements found in requirements.yaml");
  return requirements;
}

export function parseAcceptanceMatrix(content: string): AcceptanceMatrixRecord[] {
  const records: AcceptanceMatrixRecord[] = [];
  const seenIds = new Set<string>();

  for (const line of content.split("\n")) {
    if (!/^\|\s*ORCH-/.test(line)) {
      continue;
    }

    const cells = line.split("|");
    assertCondition(cells.length >= 7, `Malformed acceptance matrix row: ${line}`);

    const id = cells[1].trim();
    const verificationCell = cells[4].trim();
    const gateCell = cells[5].trim();

    assertCondition(id.length > 0, "Acceptance matrix row has empty requirement id.");
    assertCondition(
      verificationCell.length > 0,
      `Acceptance matrix row ${id} has empty verification artifact cell.`,
    );
    assertCondition(gateCell.length > 0, `Acceptance matrix row ${id} has empty gate cell.`);
    assertCondition(!seenIds.has(id), `Duplicate requirement id in acceptance matrix: ${id}`);

    seenIds.add(id);

    records.push({
      id,
      gates: normalizeList(gateCell.split(",")),
      verifications: parseVerificationIdsFromMatrixCell(verificationCell),
    });
  }

  assertCondition(records.length > 0, "No requirement rows found in acceptance matrix.");
  return records;
}

export function validateGateTraceability(
  repoRoot: string,
  gate: string,
): GateTraceValidationResult {
  const requirementsPath = resolve(repoRoot, "docs/06-acceptance/requirements.yaml");
  const matrixPath = resolve(repoRoot, "docs/06-acceptance/acceptance-matrix.md");

  assertCondition(existsSync(requirementsPath), "requirements.yaml is missing.");
  assertCondition(existsSync(matrixPath), "acceptance-matrix.md is missing.");

  const requirements = parseRequirementsYaml(readFileSync(requirementsPath, "utf-8"));
  const matrix = parseAcceptanceMatrix(readFileSync(matrixPath, "utf-8"));

  const requirementById = new Map(requirements.map((requirement) => [requirement.id, requirement]));
  const matrixById = new Map(matrix.map((record) => [record.id, record]));

  for (const matrixRecord of matrix) {
    assertCondition(
      requirementById.has(matrixRecord.id),
      `Acceptance matrix references unknown requirement: ${matrixRecord.id}`,
    );
  }

  const gatedRequirements = requirements.filter((requirement) => requirement.gates.includes(gate));
  assertCondition(gatedRequirements.length > 0, `No requirements mapped to gate ${gate}.`);

  for (const requirement of gatedRequirements) {
    const matrixRecord = matrixById.get(requirement.id);
    assertCondition(
      matrixRecord !== undefined,
      `Requirement ${requirement.id} is missing from acceptance matrix.`,
    );

    assertCondition(
      sameSet(requirement.gates, matrixRecord.gates),
      `Gate mismatch for ${requirement.id}: requirements=${requirement.gates.join(",")} matrix=${matrixRecord.gates.join(",")}`,
    );

    assertCondition(
      sameSet(requirement.verifications, matrixRecord.verifications),
      `Verification mismatch for ${requirement.id}: requirements=${requirement.verifications.join(",")} matrix=${matrixRecord.verifications.join(",")}`,
    );

    for (const verificationRelativePath of requirement.verifications) {
      const absoluteVerificationPath = resolve(repoRoot, verificationRelativePath);
      assertCondition(
        existsSync(absoluteVerificationPath),
        `Verification artifact does not exist for ${requirement.id}: ${verificationRelativePath}`,
      );

      const verificationContent = readFileSync(absoluteVerificationPath, "utf-8");
      const referencedRequirementId = parseRequirementHeader(
        verificationContent,
        verificationRelativePath,
      );
      assertCondition(
        referencedRequirementId === requirement.id,
        `Verification artifact ${verificationRelativePath} references ${referencedRequirementId}, expected ${requirement.id}`,
      );
    }
  }

  return {
    gate,
    validatedRequirementIds: gatedRequirements.map((requirement) => requirement.id).sort(),
  };
}
