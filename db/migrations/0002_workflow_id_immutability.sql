-- forward_only: true
-- requirement_id: ORCH-CORE-0001

CREATE TRIGGER IF NOT EXISTS workflow_id_immutability_tasks
BEFORE UPDATE OF workflow_id ON tasks
FOR EACH ROW
BEGIN
  SELECT RAISE(ABORT, 'workflow_id is immutable on tasks');
END;

CREATE TRIGGER IF NOT EXISTS workflow_id_immutability_leases
BEFORE UPDATE OF workflow_id ON leases
FOR EACH ROW
BEGIN
  SELECT RAISE(ABORT, 'workflow_id is immutable on leases');
END;

CREATE TRIGGER IF NOT EXISTS workflow_id_immutability_artifacts
BEFORE UPDATE OF workflow_id ON artifacts
FOR EACH ROW
BEGIN
  SELECT RAISE(ABORT, 'workflow_id is immutable on artifacts');
END;
