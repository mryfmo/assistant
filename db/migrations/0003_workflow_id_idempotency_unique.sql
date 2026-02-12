-- forward_only: true
-- requirement_id: ORCH-DATA-2001

CREATE UNIQUE INDEX IF NOT EXISTS tasks_workflow_id_idempotency_key_unique
ON tasks (workflow_id, idempotency_key);
