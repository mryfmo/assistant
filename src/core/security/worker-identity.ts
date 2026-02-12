export type WorkerAuthorizationPolicy = {
  allowlistByWorkerId: Record<
    string,
    {
      scopes: string[];
    }
  >;
};

export type WorkerAuthorizationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      code: "UNAUTHORIZED" | "FORBIDDEN";
      message: string;
    };

function parseScopes(workerCapabilitiesJson: string): string[] {
  try {
    const parsed = JSON.parse(workerCapabilitiesJson) as { scopes?: unknown };
    if (
      !Array.isArray(parsed.scopes) ||
      !parsed.scopes.every((scope) => typeof scope === "string")
    ) {
      return [];
    }

    return parsed.scopes;
  } catch {
    return [];
  }
}

export function authorizeWorker(input: {
  policy?: WorkerAuthorizationPolicy;
  workerId: string;
  workerCapabilitiesJson: string;
  requiredScope: "task.dispatch" | "task.execute";
}): WorkerAuthorizationResult {
  if (input.policy === undefined) {
    return { ok: true };
  }

  const registered = input.policy.allowlistByWorkerId[input.workerId];
  if (registered === undefined) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: `Worker ${input.workerId} is not authorized.`,
    };
  }

  const announcedScopes = new Set(parseScopes(input.workerCapabilitiesJson));
  const grantedScopes = new Set(registered.scopes);
  if (!announcedScopes.has(input.requiredScope) || !grantedScopes.has(input.requiredScope)) {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: `Worker ${input.workerId} lacks required scope ${input.requiredScope}.`,
    };
  }

  return { ok: true };
}
