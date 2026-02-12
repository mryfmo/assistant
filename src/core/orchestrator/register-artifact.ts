import { createErrorEnvelope } from "../contracts/error-envelope";
import type { ArtifactRepository } from "../persistence/artifact-repository";
import { PersistenceError } from "../persistence/types";
import type { Ack, ArtifactRef } from "../runtime/grpc/orchestrator-v1";

function buildArtifactId(ref: ArtifactRef): string {
  return `${ref.workflow_id}:${ref.task_id}:${ref.digest}`;
}

export async function registerArtifact(
  repositories: {
    artifactRepository: ArtifactRepository;
  },
  request: ArtifactRef,
): Promise<Ack> {
  try {
    await repositories.artifactRepository.registerArtifact({
      artifact_id: buildArtifactId(request),
      workflow_id: request.workflow_id,
      task_id: request.task_id,
      uri: request.uri,
      digest: request.digest,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof PersistenceError) {
      return {
        ok: false,
        error: createErrorEnvelope({
          code: "POLICY_DENIED",
          message: error.message,
          requestId: request.request_id,
          retryable: false,
        }),
      };
    }

    return {
      ok: false,
      error: createErrorEnvelope({
        code: "INTERNAL_ERROR",
        message: "Failed to register artifact.",
        requestId: request.request_id,
        retryable: false,
      }),
    };
  }
}
