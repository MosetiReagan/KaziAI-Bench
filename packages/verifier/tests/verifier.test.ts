import { describe, it, expect } from "vitest";
import { VerifierDispatcher } from "../src/index.js";
import { parseTaskString } from "@kazi-ai/task-schema";
import { LocalEnvironment } from "@kazi-ai/environment-sdk";

const TASK_SPEC = `
id: coding.fix-auth
version: 1.0.0
name: Fix Authentication Middleware
description: Fix authentication
category: coding
difficulty: medium
verification:
  type: deterministic
  checks:
    - name: Command Check
      type: command
      command: echo "AUTH_SUCCESS"
      expected_output: "AUTH_SUCCESS"
    - name: Filesystem Check
      type: filesystem
      path: package.json
      file_exists: false
scoring:
  minimum_score: 0.8
`;

describe("@kazi-ai/verifier", () => {
  it("should dispatch and execute verification checks with evidence", async () => {
    const task = parseTaskString(TASK_SPEC);
    const env = new LocalEnvironment({ id: "test_verifier_env" });
    await env.create();

    const dispatcher = new VerifierDispatcher();
    const result = await dispatcher.verify({
      task,
      environment: env,
      workspaceDir: env.workdir,
      envVars: {},
    });

    expect(result.passed).toBe(true);
    expect(result.score).toBe(1.0);
    expect(result.checks.length).toBe(2);
    expect(result.evidence.length).toBe(2);
    expect(result.checks[0]!.passed).toBe(true);

    await env.destroy();
  });
});
