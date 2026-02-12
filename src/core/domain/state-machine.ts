export type TaskLifecycleState =
  | "queued"
  | "leased"
  | "running"
  | "retry_wait"
  | "succeeded"
  | "failed"
  | "cancelled";

const legalTransitions: Readonly<Record<TaskLifecycleState, readonly TaskLifecycleState[]>> = {
  queued: ["leased", "cancelled"],
  leased: ["running", "retry_wait", "failed", "cancelled"],
  running: ["succeeded", "failed", "retry_wait", "cancelled"],
  retry_wait: ["queued", "cancelled"],
  succeeded: [],
  failed: [],
  cancelled: [],
};

export type TransitionValidation =
  | { ok: true }
  | {
      ok: false;
      code: "ILLEGAL_TASK_TRANSITION";
      message: string;
    };

export function canTransitionTaskState(
  from: TaskLifecycleState,
  to: TaskLifecycleState,
): TransitionValidation {
  const allowedDestinations = legalTransitions[from];
  if (allowedDestinations.includes(to)) {
    return { ok: true };
  }

  return {
    ok: false,
    code: "ILLEGAL_TASK_TRANSITION",
    message: `Illegal task state transition: ${from} -> ${to}.`,
  };
}

export function assertTransitionTaskState(from: TaskLifecycleState, to: TaskLifecycleState): void {
  const validation = canTransitionTaskState(from, to);
  if (!validation.ok) {
    throw new Error(validation.message);
  }
}
