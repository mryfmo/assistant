import assert from "node:assert/strict";
import test from "node:test";

import { withPostgresHarness } from "./postgres-fixture";

function parseTaskId(line: string): string | undefined {
  const trimmed = line.trim();
  if (trimmed.length === 0 || !trimmed.includes(":task:")) {
    return undefined;
  }
  return trimmed;
}

test("M8 Postgres runtime: renewal/reaper/retry/chaos under DB contention", async () => {
  const executed = await withPostgresHarness(async ({ runSql, queryValue }) => {
    const now = Date.now();

    await runSql(`
      INSERT INTO workflows (workflow_id, tenant_id, state, created_at, updated_at)
      SELECT 'wf-pg-m8-' || g::TEXT, 'tenant-a', 'active', ${now}, ${now}
      FROM generate_series(1, 20) AS g;

      INSERT INTO tasks (
        task_id, workflow_id, task_type, state, spec_json, priority,
        retry_count, next_retry_unix_ms, idempotency_key, created_at, updated_at
      )
      SELECT
        'wf-pg-m8-' || g::TEXT || ':task:0001',
        'wf-pg-m8-' || g::TEXT,
        'plan.execute',
        'queued',
        '{"intent":"postgres chaos"}',
        100,
        0,
        0,
        'req-pg-m8-' || g::TEXT || ':task:0001',
        ${now} + g,
        ${now} + g
      FROM generate_series(1, 20) AS g;
    `);

    const leaseSql = (workerId: string, issuedMs: number) => `
      WITH candidate AS (
        SELECT task_id, workflow_id
        FROM tasks
        WHERE state = 'queued'
        ORDER BY priority ASC, created_at ASC, task_id ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      ), leased AS (
        UPDATE tasks t
        SET state = 'leased', updated_at = ${issuedMs}
        FROM candidate c
        WHERE t.task_id = c.task_id
        RETURNING t.task_id, t.workflow_id
      )
      INSERT INTO leases (task_id, workflow_id, worker_id, issued_unix_ms, expires_unix_ms)
      SELECT task_id, workflow_id, '${workerId}', ${issuedMs}, ${issuedMs + 30_000}
      FROM leased
      RETURNING task_id;
    `;

    const leaseOutputs = await Promise.all(
      Array.from({ length: 30 }, (_, index) =>
        runSql(leaseSql(`worker-${index % 8}`, now + 100 + index)).then((output) =>
          output
            .split("\n")
            .map((line) => parseTaskId(line))
            .filter((value): value is string => value !== undefined),
        ),
      ),
    );

    const leasedTaskIds = leaseOutputs.flat();
    const uniqueLeasedTaskIds = new Set(leasedTaskIds);
    assert.equal(uniqueLeasedTaskIds.size, 20);
    assert.equal(leasedTaskIds.length, uniqueLeasedTaskIds.size);

    const firstTaskId = [...uniqueLeasedTaskIds][0];
    const secondTaskId = [...uniqueLeasedTaskIds][1];
    const thirdTaskId = [...uniqueLeasedTaskIds][2];

    if (firstTaskId === undefined || secondTaskId === undefined || thirdTaskId === undefined) {
      throw new Error("expected at least three leased task ids");
    }

    await runSql(`
      UPDATE leases
      SET issued_unix_ms = ${now + 500}, expires_unix_ms = ${now + 60_500}
      WHERE task_id = '${firstTaskId}' AND worker_id = (
        SELECT worker_id FROM leases WHERE task_id = '${firstTaskId}'
      );
    `);

    await runSql(`
      UPDATE tasks
      SET state = 'retry_wait', retry_count = retry_count + 1, next_retry_unix_ms = ${now + 300}
      WHERE task_id = '${secondTaskId}' AND state = 'leased';

      DELETE FROM leases WHERE task_id = '${secondTaskId}';

      UPDATE tasks
      SET state = 'queued', next_retry_unix_ms = 0, updated_at = ${now + 350}
      WHERE task_id = '${secondTaskId}'
        AND state = 'retry_wait'
        AND next_retry_unix_ms <= ${now + 350};
    `);

    await runSql(`
      UPDATE tasks
      SET state = 'running', updated_at = ${now + 700}
      WHERE task_id = '${thirdTaskId}' AND state = 'leased';

      UPDATE leases
      SET expires_unix_ms = ${now - 1}
      WHERE task_id = '${thirdTaskId}';

      WITH expired AS (
        SELECT l.task_id
        FROM leases l
        JOIN tasks t ON t.task_id = l.task_id
        WHERE l.expires_unix_ms <= ${now + 800}
          AND t.state IN ('leased', 'running')
      )
      UPDATE tasks t
      SET state = 'queued', next_retry_unix_ms = 0, updated_at = ${now + 800}
      FROM expired e
      WHERE t.task_id = e.task_id;

      DELETE FROM leases WHERE expires_unix_ms <= ${now + 800};
    `);

    const invalidStateCount = await queryValue(`
      SELECT COUNT(*)::TEXT
      FROM tasks
      WHERE state NOT IN ('queued', 'leased', 'running', 'retry_wait', 'succeeded', 'failed', 'cancelled');
    `);
    const orphanLeaseCount = await queryValue(`
      SELECT COUNT(*)::TEXT
      FROM leases l
      LEFT JOIN tasks t ON t.task_id = l.task_id
      WHERE t.task_id IS NULL;
    `);
    const duplicateLeaseCount = await queryValue(`
      SELECT COUNT(*)::TEXT FROM (
        SELECT task_id, COUNT(*)
        FROM leases
        GROUP BY task_id
        HAVING COUNT(*) > 1
      ) q;
    `);
    const requeuedSecondTask = await queryValue(`
      SELECT state FROM tasks WHERE task_id = '${secondTaskId}';
    `);
    const reapedThirdTask = await queryValue(`
      SELECT state FROM tasks WHERE task_id = '${thirdTaskId}';
    `);

    assert.equal(invalidStateCount, "0");
    assert.equal(orphanLeaseCount, "0");
    assert.equal(duplicateLeaseCount, "0");
    assert.equal(requeuedSecondTask, "queued");
    assert.equal(reapedThirdTask, "queued");
  });
  if (!executed) {
    return;
  }
});
