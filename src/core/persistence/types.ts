import type { TaskLifecycleState } from "../domain/state-machine";

export type WorkflowState = "active" | "succeeded" | "failed" | "cancelled";

export type WorkflowRecord = {
  workflow_id: string;
  tenant_id: string;
  state: WorkflowState;
  created_at: number;
  updated_at: number;
};

export type TaskRecord = {
  task_id: string;
  workflow_id: string;
  task_type: string;
  state: TaskLifecycleState;
  spec_json: Uint8Array;
  priority: number;
  retry_count: number;
  next_retry_unix_ms: number;
  idempotency_key: string;
  created_at: number;
  updated_at: number;
};

export type LeaseRecord = {
  task_id: string;
  workflow_id: string;
  worker_id: string;
  issued_unix_ms: number;
  expires_unix_ms: number;
};

export type ArtifactRecord = {
  artifact_id: string;
  workflow_id: string;
  task_id: string;
  uri: string;
  digest: string;
  created_at: number;
};

export type RuntimeDbStore = {
  workflows: Map<string, WorkflowRecord>;
  tasks: Map<string, TaskRecord>;
  leases: Map<string, LeaseRecord>;
  artifacts: Map<string, ArtifactRecord>;
};

export type RuntimeClock = {
  now: () => number;
};

export type DeterministicErrorCode =
  | "WORKFLOW_NOT_FOUND"
  | "WORKFLOW_ALREADY_EXISTS"
  | "WORKFLOW_ID_IMMUTABLE"
  | "TASK_NOT_FOUND"
  | "TASK_ALREADY_EXISTS"
  | "TASK_IDEMPOTENCY_CONFLICT"
  | "TASK_LEASE_CONFLICT"
  | "ARTIFACT_ALREADY_EXISTS"
  | "ILLEGAL_TASK_TRANSITION"
  | "INVARIANT_VIOLATION";

export class PersistenceError extends Error {
  readonly code: DeterministicErrorCode;

  constructor(code: DeterministicErrorCode, message: string) {
    super(message);
    this.name = "PersistenceError";
    this.code = code;
  }
}
