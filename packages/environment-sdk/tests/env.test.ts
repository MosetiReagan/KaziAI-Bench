import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { LocalEnvironment, SnapshotManager, ArtifactCollector } from "../src/index.js";

describe("@kazi-ai/environment-sdk", () => {
  it("should create local isolated environment and execute commands", async () => {
    const env = new LocalEnvironment({ id: "test_local_env" });
    const instance = await env.create();

    expect(instance.type).toBe("isolated-process");
    expect(fs.existsSync(instance.workdir)).toBe(true);

    const result = await env.execute({ cmd: "echo 'kazi-env-ready'" });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("kazi-env-ready");

    await env.destroy();
    expect(fs.existsSync(instance.workdir)).toBe(false);
  });

  it("should snapshot filesystem and detect created/modified files", async () => {
    const env = new LocalEnvironment({ id: "test_snap_env" });
    await env.create();

    const snap1 = await env.snapshot();

    // Create a new file in workspace
    const testFile = path.join(env.workdir, "output.txt");
    fs.writeFileSync(testFile, "sample data");

    const snap2 = await SnapshotManager.captureSnapshot(env.workdir);
    const diff = SnapshotManager.compare(snap1, snap2);

    expect(diff.added).toContain("output.txt");

    const artifacts = await ArtifactCollector.collect(env.workdir);
    expect(artifacts.some((a) => a.name === "output.txt")).toBe(true);

    await env.destroy();
  });
});
