import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { Artifact, EnvironmentError } from "@kazi-ai/core";
import {
  BenchmarkEnvironment,
  CommandOptions,
  EnvironmentInstance,
  EnvironmentSnapshot,
  ExecutionResult,
  LocalEnvironment,
} from "@kazi-ai/environment-sdk";
import { SandboxSecurityPolicy, DEFAULT_SANDBOX_POLICY } from "./policy.js";
import { SandboxSanitizer } from "./sanitizer.js";

export interface DockerSandboxOptions {
  id?: string;
  image?: string;
  baseDir?: string;
  fixturePath?: string;
  policy?: Partial<SandboxSecurityPolicy>;
}

export class DockerSandbox implements BenchmarkEnvironment {
  public readonly id: string;
  public readonly type = "docker" as const;
  public readonly workdir: string;
  private image: string;
  private containerName: string;
  private running = false;
  private localFallback?: LocalEnvironment;
  private sanitizer: SandboxSanitizer;
  private policy: SandboxSecurityPolicy;

  constructor(options: DockerSandboxOptions = {}) {
    this.id = options.id || `kazi_${nanoid(10)}`;
    this.containerName = `kazi-box-${this.id}`;
    this.image = options.image || "node:20-alpine";
    const base = options.baseDir || path.resolve(process.cwd(), ".sandbox");
    this.workdir = path.join(base, this.id);
    this.policy = { ...DEFAULT_SANDBOX_POLICY, ...(options.policy || {}) };
    this.sanitizer = new SandboxSanitizer(this.policy);
  }

  public async create(): Promise<EnvironmentInstance> {
    if (!fs.existsSync(this.workdir)) {
      fs.mkdirSync(this.workdir, { recursive: true });
    }

    // Check if Docker daemon is available
    const dockerAvailable = await this.checkDockerAvailable();
    if (!dockerAvailable) {
      // Fallback to local isolated process environment
      this.localFallback = new LocalEnvironment({
        id: this.id,
        baseDir: path.dirname(this.workdir),
      });
      return this.localFallback.create();
    }

    // Launch Docker container with security flags
    const networkFlag = this.policy.networkPolicy === "disabled" ? "--network=none" : "--network=bridge";
    const memLimit = `${this.policy.resourceLimits.memory_limit_mb}m`;
    const cpuLimit = `${this.policy.resourceLimits.cpu_limit}`;
    const pidsLimit = `${this.policy.resourceLimits.process_limit}`;

    const dockerArgs = [
      "run",
      "-d",
      "--name",
      this.containerName,
      networkFlag,
      `--memory=${memLimit}`,
      `--cpus=${cpuLimit}`,
      `--pids-limit=${pidsLimit}`,
      "-v",
      `${this.workdir}:/workspace`,
      "-w",
      "/workspace",
      this.image,
      "tail",
      "-f",
      "/dev/null",
    ];

    try {
      await this.runProcess("docker", dockerArgs);
      this.running = true;
      return {
        id: this.id,
        workdir: this.workdir,
        type: this.type,
        createdAt: new Date().toISOString(),
        metadata: { containerName: this.containerName, image: this.image },
      };
    } catch {
      // Fallback to local environment if docker run fails
      this.localFallback = new LocalEnvironment({
        id: this.id,
        baseDir: path.dirname(this.workdir),
      });
      return this.localFallback.create();
    }
  }

  public async reset(): Promise<void> {
    if (this.localFallback) return this.localFallback.reset();
    await this.destroy();
    await this.create();
  }

  public async snapshot(): Promise<EnvironmentSnapshot> {
    if (this.localFallback) return this.localFallback.snapshot();
    return {
      id: `snap_${nanoid(8)}`,
      createdAt: new Date().toISOString(),
      fileManifest: new Map(),
      metadata: { containerName: this.containerName },
    };
  }

  public async restore(snapshot: EnvironmentSnapshot): Promise<void> {
    if (this.localFallback) return this.localFallback.restore(snapshot);
  }

  public async execute(options: CommandOptions): Promise<ExecutionResult> {
    this.sanitizer.validateCommand(options.cmd);

    if (this.localFallback) {
      return this.localFallback.execute(options);
    }

    if (!this.running) {
      throw new EnvironmentError(`Docker container ${this.containerName} is not running`);
    }

    const start = Date.now();
    const timeoutMs = options.timeoutMs || 60_000;

    const execArgs = ["exec", this.containerName, "sh", "-c", options.cmd];

    return new Promise<ExecutionResult>((resolve) => {
      let stdout = "";
      let stderr = "";
      let timedOut = false;

      const child = spawn("docker", execArgs);

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, timeoutMs);

      child.stdout.on("data", (d) => (stdout += d.toString()));
      child.stderr.on("data", (d) => (stderr += d.toString()));

      child.on("close", (code) => {
        clearTimeout(timer);
        resolve({
          exitCode: timedOut ? 124 : (code ?? 0),
          stdout,
          stderr,
          durationMs: Date.now() - start,
          timedOut,
        });
      });
    });
  }

  public async collectArtifacts(): Promise<Artifact[]> {
    if (this.localFallback) return this.localFallback.collectArtifacts();
    return [];
  }

  public async destroy(): Promise<void> {
    if (this.localFallback) {
      await this.localFallback.destroy();
      return;
    }

    if (this.running) {
      try {
        await this.runProcess("docker", ["rm", "-f", this.containerName]);
      } catch {
        // ignore error during cleanup
      }
      this.running = false;
    }
  }

  private async checkDockerAvailable(): Promise<boolean> {
    try {
      await this.runProcess("docker", ["info"], 3000);
      return true;
    } catch {
      return false;
    }
  }

  private runProcess(cmd: string, args: string[], timeoutMs = 15000): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args);
      let out = "";
      let err = "";

      const timer = setTimeout(() => {
        child.kill();
        reject(new Error(`Command timed out: ${cmd} ${args.join(" ")}`));
      }, timeoutMs);

      child.stdout?.on("data", (d) => (out += d.toString()));
      child.stderr?.on("data", (d) => (err += d.toString()));

      child.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0) resolve(out);
        else reject(new Error(err || `Process exited with code ${code}`));
      });
    });
  }
}
