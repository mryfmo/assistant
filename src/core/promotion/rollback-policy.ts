export type RollbackPolicy = {
  errorRateThreshold: number;
  breachDurationSeconds: number;
};

export type RollbackDecision = {
  shouldRollback: boolean;
  reason: "THRESHOLD_EXCEEDED" | "ERROR_RATE_OK" | "DURATION_TOO_SHORT";
};

export const defaultRollbackPolicy: RollbackPolicy = {
  errorRateThreshold: 0.001,
  breachDurationSeconds: 300,
};

export function evaluateRollbackPolicy(input: {
  errorRate: number;
  currentBreachDurationSeconds: number;
  policy?: RollbackPolicy;
}): RollbackDecision {
  const policy = input.policy ?? defaultRollbackPolicy;

  if (input.errorRate <= policy.errorRateThreshold) {
    return {
      shouldRollback: false,
      reason: "ERROR_RATE_OK",
    };
  }

  if (input.currentBreachDurationSeconds < policy.breachDurationSeconds) {
    return {
      shouldRollback: false,
      reason: "DURATION_TOO_SHORT",
    };
  }

  return {
    shouldRollback: true,
    reason: "THRESHOLD_EXCEEDED",
  };
}
