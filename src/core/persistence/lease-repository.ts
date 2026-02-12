import type { RuntimePersistenceDb } from "./db";
import { type LeaseRecord, PersistenceError } from "./types";

function cloneLease(lease: LeaseRecord): LeaseRecord {
  return { ...lease };
}

export class LeaseRepository {
  constructor(private readonly db: RuntimePersistenceDb) {}

  async getLease(taskId: string): Promise<LeaseRecord | undefined> {
    const lease = this.db.readStore().leases.get(taskId);
    return lease === undefined ? undefined : cloneLease(lease);
  }

  async listLeases(): Promise<LeaseRecord[]> {
    return [...this.db.readStore().leases.values()].map((lease) => cloneLease(lease));
  }

  async listExpiredLeases(referenceTimeMs: number): Promise<LeaseRecord[]> {
    return [...this.db.readStore().leases.values()]
      .filter((lease) => lease.expires_unix_ms <= referenceTimeMs)
      .map((lease) => cloneLease(lease));
  }

  async issueLease(input: {
    task_id: string;
    workflow_id: string;
    worker_id: string;
    lease_ttl_ms: number;
  }): Promise<LeaseRecord> {
    return this.db.transaction((tx) => {
      const task = tx.store.tasks.get(input.task_id);
      if (task === undefined) {
        throw new PersistenceError("TASK_NOT_FOUND", `Task ${input.task_id} does not exist.`);
      }
      if (task.workflow_id !== input.workflow_id) {
        throw new PersistenceError(
          "WORKFLOW_ID_IMMUTABLE",
          `Task ${input.task_id} belongs to ${task.workflow_id}, not ${input.workflow_id}.`,
        );
      }
      if (tx.store.leases.has(input.task_id)) {
        throw new PersistenceError(
          "TASK_LEASE_CONFLICT",
          `Task ${input.task_id} already has an active lease.`,
        );
      }

      const issued = tx.clock.now();
      const lease: LeaseRecord = {
        task_id: input.task_id,
        workflow_id: input.workflow_id,
        worker_id: input.worker_id,
        issued_unix_ms: issued,
        expires_unix_ms: issued + input.lease_ttl_ms,
      };

      tx.store.leases.set(lease.task_id, lease);
      return cloneLease(lease);
    });
  }

  async renewLease(input: {
    task_id: string;
    worker_id: string;
    lease_ttl_ms: number;
  }): Promise<LeaseRecord> {
    return this.db.transaction((tx) => {
      const lease = tx.store.leases.get(input.task_id);
      if (lease === undefined) {
        throw new PersistenceError(
          "TASK_LEASE_CONFLICT",
          `Task ${input.task_id} has no active lease.`,
        );
      }
      if (lease.worker_id !== input.worker_id) {
        throw new PersistenceError(
          "TASK_LEASE_CONFLICT",
          `Lease for task ${input.task_id} belongs to ${lease.worker_id}.`,
        );
      }

      const issued = tx.clock.now();
      lease.issued_unix_ms = issued;
      lease.expires_unix_ms = issued + input.lease_ttl_ms;
      return cloneLease(lease);
    });
  }

  async clearLease(taskId: string): Promise<void> {
    await this.db.transaction((tx) => {
      tx.store.leases.delete(taskId);
    });
  }
}
