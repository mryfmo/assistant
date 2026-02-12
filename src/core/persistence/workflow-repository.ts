import type { RuntimeDbTransaction, RuntimePersistenceDb } from "./db";
import { PersistenceError, type WorkflowRecord, type WorkflowState } from "./types";

function resolveTimestamp(tx: RuntimeDbTransaction): number {
  return tx.clock.now();
}

export class WorkflowRepository {
  constructor(private readonly db: RuntimePersistenceDb) {}

  async createWorkflow(input: { workflow_id: string; tenant_id: string }): Promise<WorkflowRecord> {
    return this.db.transaction((tx) => {
      if (tx.store.workflows.has(input.workflow_id)) {
        throw new PersistenceError(
          "WORKFLOW_ALREADY_EXISTS",
          `Workflow ${input.workflow_id} already exists.`,
        );
      }

      const now = resolveTimestamp(tx);
      const workflow: WorkflowRecord = {
        workflow_id: input.workflow_id,
        tenant_id: input.tenant_id,
        state: "active",
        created_at: now,
        updated_at: now,
      };

      tx.store.workflows.set(input.workflow_id, workflow);
      return { ...workflow };
    });
  }

  async getWorkflow(workflowId: string): Promise<WorkflowRecord | undefined> {
    const record = this.db.readStore().workflows.get(workflowId);
    if (record === undefined) {
      return undefined;
    }

    return { ...record };
  }

  async updateWorkflowState(workflowId: string, state: WorkflowState): Promise<WorkflowRecord> {
    return this.db.transaction((tx) => {
      const workflow = tx.store.workflows.get(workflowId);
      if (workflow === undefined) {
        throw new PersistenceError("WORKFLOW_NOT_FOUND", `Workflow ${workflowId} does not exist.`);
      }

      workflow.state = state;
      workflow.updated_at = resolveTimestamp(tx);

      return { ...workflow };
    });
  }

  async countActiveWorkflowsByTenant(tenantId: string): Promise<number> {
    return [...this.db.readStore().workflows.values()].filter(
      (workflow) => workflow.tenant_id === tenantId && workflow.state === "active",
    ).length;
  }
}
