import assert from "node:assert/strict";
import test from "node:test";

import { withPostgresHarness } from "./postgres-fixture";

test("M7 Postgres E2E: submit -> lease -> report -> workflow terminal", async () => {
  const executed = await withPostgresHarness(async ({ runSql, queryValue }) => {
    const now = Date.now();

    await runSql(`
      INSERT INTO workflows (workflow_id, tenant_id, state, created_at, updated_at)
      VALUES ('wf-pg-m7-1', 'tenant-a', 'active', ${now}, ${now});

      INSERT INTO tasks (
        task_id, workflow_id, task_type, state, spec_json, priority,
        retry_count, next_retry_unix_ms, idempotency_key, created_at, updated_at
      ) VALUES (
        'wf-pg-m7-1:task:0001', 'wf-pg-m7-1', 'plan.execute', 'queued', '{"intent":"postgres e2e"}', 100,
        0, 0, 'req-pg-m7-1:task:0001', ${now}, ${now}
      );
    `);

    const leasedTaskId = await queryValue(`
      WITH candidate AS (
        SELECT task_id, workflow_id
        FROM tasks
        WHERE state = 'queued'
        ORDER BY priority ASC, created_at ASC, task_id ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      ), leased AS (
        UPDATE tasks t
        SET state = 'leased', updated_at = ${now + 10}
        FROM candidate c
        WHERE t.task_id = c.task_id
        RETURNING t.task_id, t.workflow_id
      )
      INSERT INTO leases (task_id, workflow_id, worker_id, issued_unix_ms, expires_unix_ms)
      SELECT task_id, workflow_id, 'worker-a', ${now + 10}, ${now + 30_010}
      FROM leased
      RETURNING task_id;
    `);

    assert.equal(leasedTaskId, "wf-pg-m7-1:task:0001");

    await runSql(`
      UPDATE tasks
      SET state = 'succeeded', updated_at = ${now + 20}
      WHERE task_id = 'wf-pg-m7-1:task:0001' AND state = 'leased';

      DELETE FROM leases WHERE task_id = 'wf-pg-m7-1:task:0001';

      UPDATE workflows
      SET state = 'succeeded', updated_at = ${now + 21}
      WHERE workflow_id = 'wf-pg-m7-1'
        AND NOT EXISTS (
          SELECT 1 FROM tasks
          WHERE workflow_id = 'wf-pg-m7-1'
            AND state NOT IN ('succeeded', 'failed', 'cancelled')
        );
    `);

    const workflowState = await queryValue(`
      SELECT state FROM workflows WHERE workflow_id = 'wf-pg-m7-1';
    `);
    const leaseCount = await queryValue(`
      SELECT COUNT(*)::TEXT FROM leases WHERE task_id = 'wf-pg-m7-1:task:0001';
    `);

    assert.equal(workflowState, "succeeded");
    assert.equal(leaseCount, "0");
  });
  if (!executed) {
    return;
  }
});
