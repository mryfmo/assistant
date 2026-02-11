import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { validateGateTraceability } from "./lib/acceptance-trace";

function assertCondition(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function extractMessageBlock(proto: string, messageName: string): string {
  const pattern = new RegExp(`message\\s+${messageName}\\s*\\{([\\s\\S]*?)\\n\\}`, "m");
  const match = proto.match(pattern);
  assertCondition(match !== null, `orchestrator.proto is missing message ${messageName}`);
  return match[1];
}

function assertMessageHasFields(
  proto: string,
  messageName: string,
  requiredFields: string[],
): void {
  const messageBlock = extractMessageBlock(proto, messageName);

  for (const requiredField of requiredFields) {
    const hasField = new RegExp(`\\b${requiredField}\\b`).test(messageBlock);
    assertCondition(hasField, `Message ${messageName} is missing required field ${requiredField}`);
  }
}

function main(): void {
  const repoRoot = resolve(__dirname, "../..");
  const result = validateGateTraceability(repoRoot, "G5");

  const orchestratorProtoPath = resolve(
    repoRoot,
    "contracts/proto/orchestrator/v1/orchestrator.proto",
  );
  const orchestratorProto = readFileSync(orchestratorProtoPath, "utf-8");

  assertMessageHasFields(orchestratorProto, "PlanRun", ["workflow_id"]);
  assertMessageHasFields(orchestratorProto, "Task", ["workflow_id", "task_id", "request_id"]);
  assertMessageHasFields(orchestratorProto, "TaskEvent", ["workflow_id", "task_id", "request_id"]);
  assertMessageHasFields(orchestratorProto, "TaskResult", ["workflow_id", "task_id", "request_id"]);
  assertMessageHasFields(orchestratorProto, "ArtifactRef", [
    "workflow_id",
    "task_id",
    "request_id",
  ]);

  process.stdout.write(
    `G5 integration validation passed for: ${result.validatedRequirementIds.join(", ")}\n`,
  );
}

main();
