import type { RuntimePersistenceDb } from "./db";
import { type ArtifactRecord, PersistenceError } from "./types";

function cloneArtifact(record: ArtifactRecord): ArtifactRecord {
  return { ...record };
}

export class ArtifactRepository {
  constructor(private readonly db: RuntimePersistenceDb) {}

  async registerArtifact(input: {
    artifact_id: string;
    workflow_id: string;
    task_id: string;
    uri: string;
    digest: string;
  }): Promise<ArtifactRecord> {
    return this.db.transaction((tx) => {
      if (tx.store.artifacts.has(input.artifact_id)) {
        throw new PersistenceError(
          "ARTIFACT_ALREADY_EXISTS",
          `Artifact ${input.artifact_id} already exists.`,
        );
      }

      const workflow = tx.store.workflows.get(input.workflow_id);
      if (workflow === undefined) {
        throw new PersistenceError(
          "WORKFLOW_NOT_FOUND",
          `Workflow ${input.workflow_id} does not exist.`,
        );
      }

      const task = tx.store.tasks.get(input.task_id);
      if (task !== undefined && task.workflow_id !== workflow.workflow_id) {
        throw new PersistenceError(
          "WORKFLOW_ID_IMMUTABLE",
          `Task ${input.task_id} belongs to workflow ${task.workflow_id}, not ${workflow.workflow_id}.`,
        );
      }

      const artifact: ArtifactRecord = {
        artifact_id: input.artifact_id,
        workflow_id: workflow.workflow_id,
        task_id: input.task_id,
        uri: input.uri,
        digest: input.digest,
        created_at: tx.clock.now(),
      };

      tx.store.artifacts.set(artifact.artifact_id, artifact);
      return cloneArtifact(artifact);
    });
  }

  async listArtifactsByWorkflow(workflowId: string): Promise<ArtifactRecord[]> {
    return [...this.db.readStore().artifacts.values()]
      .filter((artifact) => artifact.workflow_id === workflowId)
      .map((artifact) => cloneArtifact(artifact));
  }
}
