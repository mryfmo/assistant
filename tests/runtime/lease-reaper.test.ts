import assert from "node:assert/strict";
import test from "node:test";

import { reapExpiredLeases } from "../../src/core/orchestrator/lease-reaper";
import { RuntimePersistenceDb } from "../../src/core/persistence/db";
import { LeaseRepository } from "../../src/core/persistence/lease-repository";
import { TaskRepository } from "../../src/core/persistence/task-repository";
import { WorkflowRepository } from "../../src/core/persistence/workflow-repository";

test("expired leases are reclaimed and tasks are safely returned to queue", async () => {
  let currentNow = 1_000;
  const db = new RuntimePersistenceDb({ clock: { now: () => currentNow } });
  const workflowRepository = new WorkflowRepository(db);
  const taskRepository = new TaskRepository(db);
  const leaseRepository = new LeaseRepository(db);

  await workflowRepository.createWorkflow({ workflow_id: "wf-reaper-1", tenant_id: "tenant-a" });
  await taskRepository.createTask({
    task_id: "task-reaper-1",
    workflow_id: "wf-reaper-1",
    task_type: "execute",
    spec_json: new Uint8Array(),
    idempotency_key: "idem-reaper-1",
  });
  await taskRepository.createTask({
    task_id: "task-reaper-2",
    workflow_id: "wf-reaper-1",
    task_type: "execute",
    spec_json: new Uint8Array(),
    idempotency_key: "idem-reaper-2",
  });

  const first = await taskRepository.claimNextQueuedTask({
    worker_id: "worker-a",
    lease_ttl_ms: 5_000,
  });
  const second = await taskRepository.claimNextQueuedTask({
    worker_id: "worker-b",
    lease_ttl_ms: 5_000,
  });
  if (first === undefined || second === undefined) {
    throw new Error("expected two leased tasks");
  }

  await taskRepository.markTaskRunning(second.task.task_id);

  currentNow = 6_500;
  const reclaimed = await reapExpiredLeases(
    {
      leaseRepository,
      taskRepository,
    },
    currentNow,
  );

  assert.equal(reclaimed, 2);
  const firstAfter = await taskRepository.getTask(first.task.task_id);
  const secondAfter = await taskRepository.getTask(second.task.task_id);
  assert.equal(firstAfter?.state, "queued");
  assert.equal(secondAfter?.state, "queued");
  assert.equal(await leaseRepository.getLease(first.task.task_id), undefined);
  assert.equal(await leaseRepository.getLease(second.task.task_id), undefined);
});
