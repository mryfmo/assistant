import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { validateGateTraceability } from "./lib/acceptance-trace";

function assertCondition(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main(): void {
  const repoRoot = resolve(__dirname, "../..");
  const result = validateGateTraceability(repoRoot, "G6");

  const openworkPlanSchemaPath = resolve(repoRoot, "contracts/jsonschema/openwork-plan.v1.json");
  const openworkPlanSchemaRaw = readFileSync(openworkPlanSchemaPath, "utf-8");
  const openworkPlanSchema = JSON.parse(openworkPlanSchemaRaw) as {
    required?: unknown;
    properties?: {
      nodes?: {
        items?: {
          properties?: {
            kind?: {
              enum?: unknown;
            };
          };
        };
      };
    };
  };

  const requiredFields = openworkPlanSchema.required;
  assertCondition(
    Array.isArray(requiredFields),
    "openwork-plan schema requires a top-level required array",
  );
  assertCondition(
    requiredFields.includes("workflow_id"),
    "openwork-plan schema must require workflow_id",
  );
  assertCondition(requiredFields.includes("nodes"), "openwork-plan schema must require nodes");
  assertCondition(requiredFields.includes("edges"), "openwork-plan schema must require edges");

  const nodeKinds = openworkPlanSchema.properties?.nodes?.items?.properties?.kind?.enum;
  assertCondition(
    Array.isArray(nodeKinds),
    "openwork-plan schema must define nodes.items.properties.kind.enum",
  );

  for (const requiredKind of ["plan", "task", "clarification", "approval"]) {
    assertCondition(
      nodeKinds.includes(requiredKind),
      `openwork-plan schema missing node kind ${requiredKind}`,
    );
  }

  const clarificationPolicy = readFileSync(
    resolve(repoRoot, "docs/07-user/clarification-policy.md"),
    "utf-8",
  );
  assertCondition(
    clarificationPolicy.includes("Blocking clarification prevents execution."),
    "clarification policy must define blocking clarification behavior",
  );

  const promotionPolicy = readFileSync(
    resolve(repoRoot, "docs/04-ops/promotion-policy.md"),
    "utf-8",
  );
  assertCondition(
    promotionPolicy.includes("Direct sandbox->prod promotion is forbidden."),
    "promotion policy must explicitly forbid direct sandbox->prod promotion",
  );

  const stateMachineDoc = readFileSync(
    resolve(repoRoot, "docs/01-architecture/state-machine.md"),
    "utf-8",
  );
  assertCondition(
    stateMachineDoc.includes("ORCH-CORE-0003"),
    "state-machine doc must reference ORCH-CORE-0003",
  );
  assertCondition(
    stateMachineDoc.includes("queued -> leased") &&
      stateMachineDoc.includes("retry_wait -> queued"),
    "state-machine doc must define required transition edges",
  );

  const errorCodesDoc = readFileSync(
    resolve(repoRoot, "docs/02-contracts/error-codes.md"),
    "utf-8",
  );
  assertCondition(
    errorCodesDoc.includes("ORCH-CORE-0004"),
    "error-codes doc must reference ORCH-CORE-0004",
  );
  assertCondition(
    errorCodesDoc.includes("LEASE_CONFLICT") && errorCodesDoc.includes("Retryability Rules"),
    "error-codes doc must define lease/retry policy details",
  );

  const skillsDoc = readFileSync(resolve(repoRoot, "docs/03-integrations/skills.md"), "utf-8");
  assertCondition(
    skillsDoc.includes("ORCH-SKILL-3001"),
    "skills doc must reference ORCH-SKILL-3001",
  );
  assertCondition(
    skillsDoc.includes("sandbox") || promotionPolicy.includes("sandbox validation"),
    "skill compilation flow must include sandbox dry-run expectation",
  );

  assertCondition(
    promotionPolicy.includes("ORCH-OPS-6004"),
    "promotion policy must reference ORCH-OPS-6004",
  );

  const dataModelDoc = readFileSync(
    resolve(repoRoot, "docs/01-architecture/data-model.md"),
    "utf-8",
  );
  assertCondition(
    dataModelDoc.includes("ORCH-DATA-2001"),
    "data-model doc must reference ORCH-DATA-2001",
  );
  assertCondition(
    dataModelDoc.includes("atomic"),
    "data-model doc must define atomic transition expectations",
  );

  const performanceLimitsDoc = readFileSync(
    resolve(repoRoot, "docs/01-architecture/performance-limits.md"),
    "utf-8",
  );
  assertCondition(
    performanceLimitsDoc.includes("ORCH-OPS-6010"),
    "performance-limits doc must reference ORCH-OPS-6010",
  );
  assertCondition(
    /Max retries per task:\s*\d+/.test(performanceLimitsDoc) &&
      /timeout:\s*\d+s/i.test(performanceLimitsDoc),
    "performance-limits doc must include numeric limits and timeout units",
  );

  process.stdout.write(
    `G6 e2e validation passed for: ${result.validatedRequirementIds.join(", ")}\n`,
  );
}

main();
