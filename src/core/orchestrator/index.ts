export type OrchestratorStage = "intent" | "plan" | "execute";

export const orchestratorStages: readonly OrchestratorStage[] = ["intent", "plan", "execute"];

import { ArtifactRepository } from "../persistence/artifact-repository";
import { RuntimePersistenceDb } from "../persistence/db";
import { LeaseRepository } from "../persistence/lease-repository";
import { TaskRepository } from "../persistence/task-repository";
import { WorkflowRepository } from "../persistence/workflow-repository";
import type { RuntimeConfig } from "../runtime/config";
import type { RuntimeGrpcServiceHandlerOverrides } from "../runtime/grpc/server";
import { leaseNextTask } from "./lease-next-task";
import { registerArtifact } from "./register-artifact";
import { reportResult } from "./report-result";
import { submitPlan } from "./submit-plan";

export type RuntimeOrchestrator = {
  db: RuntimePersistenceDb;
  workflowRepository: WorkflowRepository;
  taskRepository: TaskRepository;
  leaseRepository: LeaseRepository;
  artifactRepository: ArtifactRepository;
};

export function createRuntimeOrchestrator(): RuntimeOrchestrator {
  const db = new RuntimePersistenceDb();
  return {
    db,
    workflowRepository: new WorkflowRepository(db),
    taskRepository: new TaskRepository(db),
    leaseRepository: new LeaseRepository(db),
    artifactRepository: new ArtifactRepository(db),
  };
}

export function createOrchestratorServiceHandlers(
  orchestrator: RuntimeOrchestrator,
  config: RuntimeConfig,
): RuntimeGrpcServiceHandlerOverrides {
  return {
    plan: {
      submitPlan: (request) =>
        submitPlan(
          {
            workflowRepository: orchestrator.workflowRepository,
            taskRepository: orchestrator.taskRepository,
          },
          request,
        ),
    },
    worker: {
      leaseNextTask: (request) =>
        leaseNextTask(
          {
            taskRepository: orchestrator.taskRepository,
            leaseRepository: orchestrator.leaseRepository,
          },
          request,
          config.leaseTtlSeconds * 1_000,
        ),
      renewLease: () => ({ ok: true }),
      reportEvent: () => ({ ok: true }),
      reportResult: (request) =>
        reportResult(
          {
            taskRepository: orchestrator.taskRepository,
            workflowRepository: orchestrator.workflowRepository,
          },
          request,
        ),
    },
    artifact: {
      registerArtifact: (request) =>
        registerArtifact(
          {
            artifactRepository: orchestrator.artifactRepository,
          },
          request,
        ),
    },
  };
}

export { submitPlan } from "./submit-plan";
export { leaseNextTask } from "./lease-next-task";
export { reportResult } from "./report-result";
export { registerArtifact } from "./register-artifact";
