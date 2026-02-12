import assert from "node:assert/strict";
import test from "node:test";

import { validateSkillManifest } from "../../src/core/skills/skill-manifest-validator";

test("valid skill manifest passes schema and permission validation", () => {
  const result = validateSkillManifest({
    name: "worker-exec",
    version: "1.0.0",
    description: "Run task execution",
    inputs: ["task_spec"],
    outputs: ["task_result"],
    permissions: ["task.execute", "artifact.write"],
    entrypoint: "dist/index.js",
  });

  assert.equal(result.ok, true);
});

test("malformed skill manifest is rejected deterministically", () => {
  const result = validateSkillManifest({
    version: "1.0.0",
    description: "missing name",
    inputs: ["task_spec"],
    outputs: ["task_result"],
    permissions: ["task.execute"],
  });

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("expected validation failure");
  }

  assert.equal(result.code, "INVALID_REQUEST");
});

test("invalid permission is rejected by policy deterministically", () => {
  const result = validateSkillManifest({
    name: "worker-exec",
    version: "1.0.0",
    description: "invalid permission",
    inputs: ["task_spec"],
    outputs: ["task_result"],
    permissions: ["filesystem.delete"],
  });

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("expected policy failure");
  }

  assert.equal(result.code, "POLICY_DENIED");
  assert.equal(result.message, "Permission 'filesystem.delete' is not allowed by policy.");
});
