-- forward_only: true
-- requirement_id: ORCH-CORE-0003

CREATE TRIGGER IF NOT EXISTS tasks_state_transition_guard
BEFORE UPDATE OF state ON tasks
FOR EACH ROW
BEGIN
  SELECT
    CASE
      WHEN OLD.state = NEW.state THEN 0
      WHEN OLD.state = 'queued' AND NEW.state IN ('leased', 'cancelled') THEN 0
      WHEN OLD.state = 'leased' AND NEW.state IN ('running', 'retry_wait', 'failed', 'cancelled') THEN 0
      WHEN OLD.state = 'running' AND NEW.state IN ('succeeded', 'failed', 'retry_wait', 'cancelled') THEN 0
      WHEN OLD.state = 'retry_wait' AND NEW.state IN ('queued', 'cancelled') THEN 0
      ELSE RAISE(ABORT, 'illegal task state transition')
    END;
END;
