import { describe, it, expect } from "vitest";
import { PolicyManager, SandboxSanitizer, DockerSandbox } from "../src/index.js";
import { SecurityViolationError } from "@kazi-ai/core";

describe("@kazi-ai/sandbox", () => {
  it("should enforce default sandbox security policies", () => {
    const manager = new PolicyManager();
    const policy = manager.getPolicy();

    expect(policy.networkPolicy).toBe("disabled");
    expect(policy.resourceLimits.memory_limit_mb).toBe(2048);
    expect(policy.allowHostDockerSocket).toBe(false);
  });

  it("should prevent forbidden commands from running", () => {
    const policy = new PolicyManager().getPolicy();
    const sanitizer = new SandboxSanitizer(policy);

    expect(() => sanitizer.validateCommand("rm -rf /")).toThrow(SecurityViolationError);
    expect(() => sanitizer.validateCommand("sudo apt install")).toThrow(SecurityViolationError);
    expect(() => sanitizer.validateCommand(":(){ :|:& };:")).toThrow(SecurityViolationError);
  });

  it("should prevent path traversal outside workspace", () => {
    const policy = new PolicyManager().getPolicy();
    const sanitizer = new SandboxSanitizer(policy);

    expect(() => sanitizer.validatePath("../../../etc/shadow", "/workspace/test")).toThrow(SecurityViolationError);
  });

  it("should sanitize environment variables containing secrets", () => {
    const policy = new PolicyManager().getPolicy();
    const sanitizer = new SandboxSanitizer(policy);

    const dirtyEnv = {
      PATH: "/usr/bin",
      OPENAI_API_KEY: "sk-secret123",
      AWS_SECRET_ACCESS_KEY: "awssecret",
      DATABASE_PASSWORD: "pw",
      SAFE_PARAM: "public_value",
    };

    const clean = sanitizer.sanitizeEnv(dirtyEnv);
    expect(clean.OPENAI_API_KEY).toBeUndefined();
    expect(clean.AWS_SECRET_ACCESS_KEY).toBeUndefined();
    expect(clean.DATABASE_PASSWORD).toBeUndefined();
    expect(clean.SAFE_PARAM).toBe("public_value");
    expect(clean.PATH).toBe("/usr/bin");
  });

  it("should initialize DockerSandbox and fallback to local if docker is inactive", async () => {
    const box = new DockerSandbox({ id: "test_sandbox_inst" });
    const inst = await box.create();
    expect(inst.id).toBe("test_sandbox_inst");

    const result = await box.execute({ cmd: "echo 'hello kazi sandbox'" });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("hello kazi sandbox");

    await box.destroy();
  });
});
