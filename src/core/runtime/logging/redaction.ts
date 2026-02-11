const REDACTED_VALUE = "[REDACTED]";
const CIRCULAR_VALUE = "[CIRCULAR]";

const sensitiveKeyPattern =
  /(pass(word)?|secret|token|api[-_]?key|authorization|cookie|credential|session|private[-_]?key)/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function shouldRedactKey(key: string): boolean {
  return sensitiveKeyPattern.test(key);
}

function redactRecursive(
  value: unknown,
  redactedValue: string,
  traversing: WeakSet<object>,
): unknown {
  if (Array.isArray(value)) {
    if (traversing.has(value)) {
      return CIRCULAR_VALUE;
    }

    traversing.add(value);
    const redactedArray = value.map((entry) => redactRecursive(entry, redactedValue, traversing));
    traversing.delete(value);

    return redactedArray;
  }

  if (!isRecord(value)) {
    return value;
  }

  if (traversing.has(value)) {
    return CIRCULAR_VALUE;
  }

  traversing.add(value);

  const redactedEntries = Object.entries(value).map(([key, nestedValue]) => {
    if (shouldRedactKey(key)) {
      return [key, redactedValue] as const;
    }
    return [key, redactRecursive(nestedValue, redactedValue, traversing)] as const;
  });

  traversing.delete(value);

  return Object.fromEntries(redactedEntries);
}

export function redactLogPayload(payload: unknown, redactedValue = REDACTED_VALUE): unknown {
  return redactRecursive(payload, redactedValue, new WeakSet<object>());
}

export function defaultRedactedValue(): string {
  return REDACTED_VALUE;
}
