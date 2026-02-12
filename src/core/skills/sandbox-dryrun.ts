import type { ArtifactRecord } from "../persistence/types";

export const sandboxDryRunEvidenceUriPrefix = "evidence://sandbox/dry-run/";

const sha256DigestPattern = /^sha256:[a-f0-9]{64}$/;

export function isSandboxDryRunEvidenceRef(input: { uri: string; digest: string }): boolean {
  if (!input.uri.startsWith(sandboxDryRunEvidenceUriPrefix)) {
    return false;
  }

  return sha256DigestPattern.test(input.digest);
}

export function hasSandboxDryRunEvidence(artifacts: ArtifactRecord[]): boolean {
  return artifacts.some((artifact) =>
    isSandboxDryRunEvidenceRef({
      uri: artifact.uri,
      digest: artifact.digest,
    }),
  );
}

export function assertSandboxDryRunEvidence(artifacts: ArtifactRecord[]):
  | {
      ok: true;
    }
  | {
      ok: false;
      code: "POLICY_DENIED";
      message: string;
    } {
  if (hasSandboxDryRunEvidence(artifacts)) {
    return { ok: true };
  }

  return {
    ok: false,
    code: "POLICY_DENIED",
    message: "Promotion requires sandbox dry-run evidence artifact.",
  };
}
