import { execSync } from "child_process";
import os from "os";
import { BENCHMARK_VERSION } from "./constants.js";

const CROCKFORD_BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generateRunId(prefix = "run"): string {
  const now = Date.now();
  let timeStr = "";
  let n = now;
  for (let i = 0; i < 10; i++) {
    timeStr = CROCKFORD_BASE32[n % 32] + timeStr;
    n = Math.floor(n / 32);
  }

  let randomStr = "";
  for (let i = 0; i < 16; i++) {
    const r = Math.floor(Math.random() * 32);
    randomStr += CROCKFORD_BASE32[r];
  }

  return `${prefix}_01J${timeStr.slice(0, 5)}${randomStr.slice(0, 10)}`;
}

export interface SystemRunMetadata {
  runId: string;
  benchmarkVersion: string;
  gitCommit: string;
  nodeVersion: string;
  osPlatform: string;
  osRelease: string;
  seed: string | number;
  createdAt: string;
}

export function captureRunMetadata(runId: string, seed: string | number): SystemRunMetadata {
  let gitCommit = "unknown";
  try {
    gitCommit = execSync("git rev-parse HEAD", { stdio: "pipe" }).toString().trim();
  } catch {
    // not in git repo or git not available
  }

  return {
    runId,
    benchmarkVersion: BENCHMARK_VERSION,
    gitCommit,
    nodeVersion: process.version,
    osPlatform: os.platform(),
    osRelease: os.release(),
    seed,
    createdAt: new Date().toISOString(),
  };
}
