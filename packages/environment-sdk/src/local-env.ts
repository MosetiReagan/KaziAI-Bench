import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import crypto from "crypto";
import { nanoid } from "nanoid";
import { Artifact, EnvironmentError } from "@kazi-ai/core";
import {
  BenchmarkEnvironment,
  CommandOptions,
  EnvironmentInstance,
  EnvironmentSnapshot,
  ExecutionResult,
} from "./types.js";

export interface LocalEnvironmentOptions {
  id?: string;
  baseDir?: string;
  fixturePath?: string;
  initialEnv?: Record<string, string>;
  defaultTimeoutMs?: number;
}

export class LocalEnvironment implements BenchmarkEnvironment {
  public readonly id: string;
  public readonly type = "isolated-process" as const;
  public readonly workdir: string;
  private destroyed = false;
  private defaultTimeoutMs: number;
  private envVars: Record<string, string>;
  private fixturePath?: string;

  constructor(options: LocalEnvironmentOptions = {}) {
    this.id = options.id || `env_${nanoid(10)}`;
    const base = options.baseDir || path.resolve(process.cwd(), ".sandbox");
    this.workdir = path.join(base, this.id);
    this.defaultTimeoutMs = options.defaultTimeoutMs || 60_000;
    this.envVars = { ...options.initialEnv };
    this.fixturePath = options.fixturePath;
  }

  public async create(): Promise<EnvironmentInstance> {
    try {
      if (!fs.existsSync(this.workdir)) {
        fs.mkdirSync(this.workdir, { recursive: true });
      }

      if (this.fixturePath && fs.existsSync(this.fixturePath)) {
        this.copyRecursiveSync(this.fixturePath, this.workdir);
      }

      return {
        id: this.id,
        workdir: this.workdir,
        type: this.type,
        createdAt: new Date().toISOString(),
        metadata: {
          fixturePath: this.fixturePath,
        },
      };
    } catch (err) {
      throw new EnvironmentError(`Failed to create isolated environment at ${this.workdir}: ${String(err)}`);
    }
  }

  public async reset(): Promise<void> {
    if (this.destroyed) {
      throw new EnvironmentError(`Cannot reset destroyed environment ${this.id}`);
    }
    if (fs.existsSync(this.workdir)) {
      fs.rmSync(this.workdir, { recursive: true, force: true });
    }
    await this.create();
  }

  public async snapshot(): Promise<EnvironmentSnapshot> {
    const manifest = new Map<string, string>();
    this.computeFileHashes(this.workdir, "", manifest);
    return {
      id: `snap_${nanoid(8)}`,
      createdAt: new Date().toISOString(),
      fileManifest: manifest,
      metadata: { workdir: this.workdir },
    };
  }

  public async restore(snapshot: EnvironmentSnapshot): Promise<void> {
    // Basic verification of snapshot restoration
    if (!snapshot || !snapshot.fileManifest) {
      throw new EnvironmentError("Invalid snapshot format");
    }
  }

  public async execute(options: CommandOptions): Promise<ExecutionResult> {
    if (this.destroyed) {
      throw new EnvironmentError(`Cannot execute in destroyed environment ${this.id}`);
    }

    const start = Date.now();
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;
    const executionCwd = options.cwd ? path.resolve(this.workdir, options.cwd) : this.workdir;

    // Security: cwd must reside within the workdir
    if (!executionCwd.startsWith(this.workdir)) {
      throw new EnvironmentError(`Directory traversal prevented: ${executionCwd} is outside workspace`);
    }

    // Sanitized environment variables: never leak host secrets
    const sanitizedEnv: NodeJS.ProcessEnv = {
      PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
      NODE_ENV: "test",
      HOME: this.workdir,
      TMPDIR: this.workdir,
      ...this.envVars,
      ...(options.env || {}),
    };

    return new Promise<ExecutionResult>((resolve) => {
      let stdout = "";
      let stderr = "";
      let timedOut = false;

      const child = spawn("sh", ["-c", options.cmd], {
        cwd: executionCwd,
        env: sanitizedEnv,
      });

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, timeoutMs);

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        resolve({
          exitCode: 1,
          stdout,
          stderr: stderr + "\n" + err.message,
          durationMs: Date.now() - start,
          timedOut,
          error: err.message,
        });
      });

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
    const artifacts: Artifact[] = [];
    if (!fs.existsSync(this.workdir)) return artifacts;

    const findArtifacts = (dir: string) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const f of files) {
        const full = path.join(dir, f.name);
        if (f.isDirectory()) {
          if (f.name !== "node_modules" && f.name !== ".git") {
            findArtifacts(full);
          }
        } else if (f.isFile()) {
          const stat = fs.statSync(full);
          artifacts.push({
            name: path.relative(this.workdir, full),
            path: full,
            sizeBytes: stat.size,
          });
        }
      }
    };

    findArtifacts(this.workdir);
    return artifacts;
  }

  public async destroy(): Promise<void> {
    this.destroyed = true;
    if (fs.existsSync(this.workdir)) {
      try {
        fs.rmSync(this.workdir, { recursive: true, force: true });
      } catch {
        // cleanup best-effort
      }
    }
  }

  private copyRecursiveSync(src: string, dest: string) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats && stats.isDirectory();
    if (isDirectory) {
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      fs.readdirSync(src).forEach((childItemName) => {
        this.copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  private computeFileHashes(dir: string, relPath: string, map: Map<string, string>) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      const rel = path.join(relPath, e.name);
      if (e.isDirectory()) {
        if (e.name !== "node_modules" && e.name !== ".git") {
          this.computeFileHashes(full, rel, map);
        }
      } else if (e.isFile()) {
        try {
          const buf = fs.readFileSync(full);
          const hash = crypto.createHash("sha256").update(buf).digest("hex");
          map.set(rel, hash);
        } catch {
          // Ignore read errors for transient files
        }
      }
    }
  }
}
