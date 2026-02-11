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

  process.stdout.write(
    `G6 e2e validation passed for: ${result.validatedRequirementIds.join(", ")}\n`,
  );
}

main();
