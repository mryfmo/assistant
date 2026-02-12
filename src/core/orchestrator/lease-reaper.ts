import type { LeaseRepository } from "../persistence/lease-repository";
import type { TaskRepository } from "../persistence/task-repository";
import { PersistenceError } from "../persistence/types";

export async function reapExpiredLeases(
  repositories: {
    leaseRepository: LeaseRepository;
    taskRepository: TaskRepository;
  },
  referenceTimeMs: number,
): Promise<number> {
  const expiredLeases = await repositories.leaseRepository.listExpiredLeases(referenceTimeMs);
  let reclaimedCount = 0;

  for (const lease of expiredLeases) {
    const task = await repositories.taskRepository.getTask(lease.task_id);
    if (task === undefined) {
      await repositories.leaseRepository.clearLease(lease.task_id);
      continue;
    }

    try {
      if (task.state === "leased") {
        await repositories.taskRepository.transitionTaskState({
          task_id: task.task_id,
          expected_from_state: "leased",
          to_state: "retry_wait",
        });
        await repositories.taskRepository.enqueueRetry(task.task_id);
      } else if (task.state === "running") {
        await repositories.taskRepository.transitionTaskState({
          task_id: task.task_id,
          expected_from_state: "running",
          to_state: "retry_wait",
        });
        await repositories.taskRepository.enqueueRetry(task.task_id);
      }

      await repositories.leaseRepository.clearLease(lease.task_id);
      reclaimedCount += 1;
    } catch (error) {
      if (
        error instanceof PersistenceError &&
        (error.code === "ILLEGAL_TASK_TRANSITION" || error.code === "TASK_NOT_FOUND")
      ) {
        await repositories.leaseRepository.clearLease(lease.task_id);
        continue;
      }

      throw error;
    }
  }

  return reclaimedCount;
}
