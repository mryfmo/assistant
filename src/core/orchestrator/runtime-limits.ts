export type RuntimeLimitCheckResult =
  | { ok: true }
  | {
      ok: false;
      code: "POLICY_DENIED";
      message: string;
    };

export function enforcePayloadLimit(input: {
  payloadBytes: number;
  maxPayloadBytes: number;
}): RuntimeLimitCheckResult {
  if (input.payloadBytes <= input.maxPayloadBytes) {
    return { ok: true };
  }

  return {
    ok: false,
    code: "POLICY_DENIED",
    message: `Task payload exceeds configured limit (${input.maxPayloadBytes} bytes).`,
  };
}

export function enforceTenantWorkflowLimit(input: {
  activeWorkflowCount: number;
  maxActiveWorkflows: number;
}): RuntimeLimitCheckResult {
  if (input.activeWorkflowCount < input.maxActiveWorkflows) {
    return { ok: true };
  }

  return {
    ok: false,
    code: "POLICY_DENIED",
    message: `Tenant active workflow limit reached (${input.maxActiveWorkflows}).`,
  };
}

export function enforceLoadShedding(input: {
  queuedTaskCount: number;
  maxActiveWorkflowsPerTenant: number;
}): RuntimeLimitCheckResult {
  const sheddingThreshold = input.maxActiveWorkflowsPerTenant * 4;
  if (input.queuedTaskCount < sheddingThreshold) {
    return { ok: true };
  }

  return {
    ok: false,
    code: "POLICY_DENIED",
    message: `Load shedding active at queue depth ${input.queuedTaskCount}.`,
  };
}
