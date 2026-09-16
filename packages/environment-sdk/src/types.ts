import { Artifact } from "@kazi-ai/core";

export interface CommandOptions {
  cmd: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

export interface ExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
  error?: string;
}

export interface EnvironmentSnapshot {
  id: string;
  createdAt: string;
  fileManifest: Map<string, string>; // relativePath -> sha256
  metadata: Record<string, unknown>;
}

export interface EnvironmentInstance {
  id: string;
  workdir: string;
  type: "docker" | "isolated-process";
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface BenchmarkEnvironment {
  readonly id: string;
  readonly type: "docker" | "isolated-process";
  readonly workdir: string;

  create(): Promise<EnvironmentInstance>;
  reset(): Promise<void>;
  snapshot(): Promise<EnvironmentSnapshot>;
  restore(snapshot: EnvironmentSnapshot): Promise<void>;
  execute(command: CommandOptions): Promise<ExecutionResult>;
  collectArtifacts(pattern?: string): Promise<Artifact[]>;
  destroy(): Promise<void>;
}
