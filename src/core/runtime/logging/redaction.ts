const REDACTED_VALUE = "[REDACTED]";

const sensitiveKeyPattern =
  /(pass(word)?|secret|token|api[-_]?key|authorization|cookie|credential|session|private[-_]?key)/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function shouldRedactKey(key: string): boolean {
  return sensitiveKeyPattern.test(key);
}

function redactRecursive(value: unknown, redactedValue: string): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactRecursive(entry, redactedValue));
  }

  if (!isRecord(value)) {
    return value;
  }

  const redactedEntries = Object.entries(value).map(([key, nestedValue]) => {
    if (shouldRedactKey(key)) {
      return [key, redactedValue] as const;
    }
    return [key, redactRecursive(nestedValue, redactedValue)] as const;
  });

  return Object.fromEntries(redactedEntries);
}

export function redactLogPayload(payload: unknown, redactedValue = REDACTED_VALUE): unknown {
  return redactRecursive(payload, redactedValue);
}

export function defaultRedactedValue(): string {
  return REDACTED_VALUE;
}
