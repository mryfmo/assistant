import assert from "node:assert/strict";
import test from "node:test";

import { loadRuntimeConfig } from "../../src/core/runtime/config";
import {
  createServerCredentials,
  mtlsRequirementForEnv,
} from "../../src/core/runtime/grpc/tls-config";
import { createMtlsConfig } from "./mtls-fixture";

test("mTLS environment policy matrix is enforced across runtime config", () => {
  assert.equal(mtlsRequirementForEnv("sandbox"), "optional");
  assert.equal(mtlsRequirementForEnv("staging"), "required");
  assert.equal(mtlsRequirementForEnv("prod"), "required");

  const sandboxDefault = loadRuntimeConfig({ ORCH_ENV: "sandbox" });
  assert.equal(sandboxDefault.requireMtls, false);

  const sandboxEnabled = loadRuntimeConfig({
    ORCH_ENV: "sandbox",
    ORCH_REQUIRE_MTLS: "true",
  });
  assert.equal(sandboxEnabled.requireMtls, true);

  const stagingDefault = loadRuntimeConfig({ ORCH_ENV: "staging" });
  assert.equal(stagingDefault.requireMtls, true);

  assert.throws(
    () =>
      loadRuntimeConfig({
        ORCH_ENV: "prod",
        ORCH_REQUIRE_MTLS: "false",
      }),
    new Error("Invalid ORCH_REQUIRE_MTLS: staging/prod require mTLS."),
  );

  const sandboxInsecureCreds = createServerCredentials({
    ...createMtlsConfig({ env: "sandbox" }),
    requireMtls: false,
  });
  assert.notEqual(sandboxInsecureCreds, undefined);

  assert.throws(
    () =>
      createServerCredentials({
        ...createMtlsConfig({ env: "staging" }),
        tlsCaCertPath: undefined,
      }),
    new Error("Missing required TLS path: tlsCaCertPath."),
  );
});
