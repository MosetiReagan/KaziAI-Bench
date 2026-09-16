import { describe, it, expect } from "vitest";
import path from "path";
import fs from "fs";
import { loadTaskFromFile, loadTasksFromDirectory } from "@kazi-ai/task-schema";
import { LocalEnvironment } from "@kazi-ai/environment-sdk";
import { VerifierDispatcher } from "@kazi-ai/verifier";

describe("Benchmark Tasks End-to-End Validation", () => {
  it("should load and validate all benchmark task definitions", () => {
    const benchmarksDir = path.resolve(process.cwd(), "benchmarks");
    const tasks = loadTasksFromDirectory(benchmarksDir);

    expect(tasks.length).toBeGreaterThanOrEqual(10);
    const taskIds = tasks.map((t) => t.id);

    expect(taskIds).toContain("coding.fix-auth");
    expect(taskIds).toContain("coding.fix-pagination");
    expect(taskIds).toContain("debugging.api-500");
    expect(taskIds).toContain("debugging.worker-failure");
    expect(taskIds).toContain("database.query-optimization");
    expect(taskIds).toContain("security.command-injection");
    expect(taskIds).toContain("terminal.disk-diagnosis");
    expect(taskIds).toContain("devops.docker-healthcheck");
    expect(taskIds).toContain("api.webhook-idempotency");
    expect(taskIds).toContain("mcp.tool-selection");
  });

  it("should execute real coding.fix-auth task and verify remediation", async () => {
    const taskPath = path.resolve(process.cwd(), "benchmarks/coding/fix-auth/task.yaml");
    const task = loadTaskFromFile(taskPath);

    const fixturePath = path.resolve(process.cwd(), "benchmarks/coding/fix-auth/fixture");
    const env = new LocalEnvironment({
      id: "test_fix_auth_run",
      fixturePath,
    });

    await env.create();

    // Verify baseline failure before fix
    const check1 = await env.execute({ cmd: "node test.js" });
    expect(check1.exitCode).not.toBe(0);

    // Apply remediation solve script
    const solveRes = await env.execute({ cmd: "sh solve.sh" });
    expect(solveRes.exitCode).toBe(0);

    // Dispatch deterministic verifier
    const verifier = new VerifierDispatcher();
    const result = await verifier.verify({
      task,
      environment: env,
      workspaceDir: env.workdir,
      envVars: {},
    });

    expect(result.passed).toBe(true);
    expect(result.score).toBe(1.0);
    expect(result.checks.length).toBeGreaterThan(0);
    expect(result.checks[0]!.passed).toBe(true);

    await env.destroy();
  });

  it("should execute real security.command-injection task and verify exploit prevention", async () => {
    const taskPath = path.resolve(process.cwd(), "benchmarks/security/command-injection/task.yaml");
    const task = loadTaskFromFile(taskPath);

    const fixturePath = path.resolve(process.cwd(), "benchmarks/security/command-injection/fixture");
    const env = new LocalEnvironment({
      id: "test_security_run",
      fixturePath,
    });

    await env.create();

    // Baseline fails because vulnerable ping allows injected echo
    const check1 = await env.execute({ cmd: "node test.js" });
    expect(check1.exitCode).not.toBe(0);

    // Apply fix
    await env.execute({ cmd: "sh solve.sh" });

    // Verifier confirms vulnerability remediated
    const verifier = new VerifierDispatcher();
    const result = await verifier.verify({
      task,
      environment: env,
      workspaceDir: env.workdir,
      envVars: {},
    });

    expect(result.passed).toBe(true);
    expect(result.score).toBe(1.0);

    await env.destroy();
  });
});
