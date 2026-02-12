export type SkillManifest = {
  name: string;
  version: string;
  description: string;
  inputs: string[];
  outputs: string[];
  permissions: string[];
  entrypoint?: string;
};

export type SkillManifestValidationResult =
  | {
      ok: true;
      manifest: SkillManifest;
    }
  | {
      ok: false;
      code: "INVALID_REQUEST" | "POLICY_DENIED";
      message: string;
    };

const skillNamePattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const allowedPermissions = new Set([
  "plan.read",
  "plan.write",
  "task.dispatch",
  "task.execute",
  "artifact.write",
  "artifact.read",
  "approval.request",
  "approval.consume",
]);

function asRecord(input: unknown): Record<string, unknown> | undefined {
  if (typeof input !== "object" || input === null) {
    return undefined;
  }

  return input as Record<string, unknown>;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function invalid(message: string): SkillManifestValidationResult {
  return {
    ok: false,
    code: "INVALID_REQUEST",
    message,
  };
}

function denied(message: string): SkillManifestValidationResult {
  return {
    ok: false,
    code: "POLICY_DENIED",
    message,
  };
}

export function validateSkillManifest(input: unknown): SkillManifestValidationResult {
  const manifest = asRecord(input);
  if (manifest === undefined) {
    return invalid("Skill manifest must be a JSON object.");
  }

  const allowedFields = new Set([
    "name",
    "version",
    "description",
    "inputs",
    "outputs",
    "permissions",
    "entrypoint",
  ]);

  for (const key of Object.keys(manifest)) {
    if (!allowedFields.has(key)) {
      return invalid(`Unknown manifest field: ${key}.`);
    }
  }

  const name = manifest.name;
  const version = manifest.version;
  const description = manifest.description;
  const inputs = manifest.inputs;
  const outputs = manifest.outputs;
  const permissions = manifest.permissions;
  const entrypoint = manifest.entrypoint;

  if (typeof name !== "string" || !skillNamePattern.test(name)) {
    return invalid("Manifest field 'name' must match ^[a-z0-9]+(-[a-z0-9]+)*$.");
  }
  if (typeof version !== "string" || version.trim().length === 0) {
    return invalid("Manifest field 'version' must be a non-empty string.");
  }
  if (typeof description !== "string" || description.trim().length === 0) {
    return invalid("Manifest field 'description' must be a non-empty string.");
  }
  if (!isStringArray(inputs)) {
    return invalid("Manifest field 'inputs' must be an array of strings.");
  }
  if (!isStringArray(outputs)) {
    return invalid("Manifest field 'outputs' must be an array of strings.");
  }
  if (!isStringArray(permissions)) {
    return invalid("Manifest field 'permissions' must be an array of strings.");
  }
  if (entrypoint !== undefined && typeof entrypoint !== "string") {
    return invalid("Manifest field 'entrypoint' must be a string when provided.");
  }

  for (const permission of permissions) {
    if (!allowedPermissions.has(permission)) {
      return denied(`Permission '${permission}' is not allowed by policy.`);
    }
  }

  return {
    ok: true,
    manifest: {
      name,
      version,
      description,
      inputs,
      outputs,
      permissions,
      entrypoint,
    },
  };
}
