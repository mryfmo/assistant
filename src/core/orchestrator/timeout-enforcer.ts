export function isTimeoutExceeded(input: {
  startedUnixMs: number;
  nowUnixMs: number;
  timeoutSeconds: number;
}): boolean {
  return input.nowUnixMs - input.startedUnixMs > input.timeoutSeconds * 1_000;
}

export function timeoutErrorMessage(kind: "plan" | "task", timeoutSeconds: number): string {
  return `${kind} timeout exceeded (${timeoutSeconds}s).`;
}
