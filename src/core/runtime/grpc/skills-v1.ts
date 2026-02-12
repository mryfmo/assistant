export type SkillStatus =
  | "SKILL_STATUS_UNSPECIFIED"
  | "SKILL_STATUS_RUNNING"
  | "SKILL_STATUS_SUCCEEDED"
  | "SKILL_STATUS_FAILED";

export type SkillErrorCode =
  | "SKILL_ERROR_CODE_UNSPECIFIED"
  | "SKILL_ERROR_CODE_INVALID_INPUT"
  | "SKILL_ERROR_CODE_POLICY_DENIED"
  | "SKILL_ERROR_CODE_RUNTIME_FAILURE";

export type SkillInvokeRequest = {
  request_id: string;
  skill_name: string;
  workflow_id: string;
  input_json: Uint8Array;
};

export type SkillLogEvent = {
  request_id: string;
  workflow_id: string;
  message: string;
  timestamp_unix_ms: number;
};

export type SkillInvokeResponse = {
  request_id: string;
  status: SkillStatus;
  output_json: Uint8Array;
  error_code: SkillErrorCode;
  error_message: string;
};
