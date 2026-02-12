import type { ErrorEnvelope } from "../../contracts/error-envelope";

export type TaskState =
  | "TASK_STATE_UNSPECIFIED"
  | "TASK_STATE_QUEUED"
  | "TASK_STATE_LEASED"
  | "TASK_STATE_RUNNING"
  | "TASK_STATE_RETRY_WAIT"
  | "TASK_STATE_SUCCEEDED"
  | "TASK_STATE_FAILED"
  | "TASK_STATE_CANCELLED";

export type TaskEventType =
  | "TASK_EVENT_TYPE_UNSPECIFIED"
  | "TASK_EVENT_TYPE_CREATED"
  | "TASK_EVENT_TYPE_LEASED"
  | "TASK_EVENT_TYPE_STARTED"
  | "TASK_EVENT_TYPE_PROGRESS"
  | "TASK_EVENT_TYPE_COMPLETED"
  | "TASK_EVENT_TYPE_FAILED"
  | "TASK_EVENT_TYPE_CANCELLED";

export type PlanRun = {
  request_id: string;
  workflow_id: string;
  tenant_id: string;
  intent: string;
};

export type Task = {
  request_id: string;
  task_id: string;
  workflow_id: string;
  task_type: string;
  state: TaskState;
  spec_json: Uint8Array;
};

export type Lease = {
  request_id: string;
  task_id: string;
  worker_id: string;
  expires_unix_ms: number;
};

export type TaskEvent = {
  request_id: string;
  workflow_id: string;
  task_id: string;
  event_type: TaskEventType;
  message: string;
  timestamp_unix_ms: number;
};

export type TaskResult = {
  request_id: string;
  workflow_id: string;
  task_id: string;
  success: boolean;
  result_json: Uint8Array;
  error?: ErrorEnvelope;
};

export type ArtifactRef = {
  request_id: string;
  workflow_id: string;
  task_id: string;
  uri: string;
  digest: string;
};

export type Ack = {
  ok: boolean;
  error?: ErrorEnvelope;
};

export type LeaseRequest = {
  request_id: string;
  worker_id: string;
  worker_capabilities_json: string;
};

export type LeaseResponse = {
  lease?: Lease;
  task?: Task;
  error?: ErrorEnvelope;
};
