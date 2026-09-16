import { BenchmarkCategory, BenchmarkDifficulty } from "./constants.js";

export type RunStatus =
  | "CREATED"
  | "QUEUED"
  | "INITIALIZING"
  | "RUNNING"
  | "VERIFYING"
  | "COMPLETED"
  | "FAILED"
  | "TIMEOUT"
  | "CANCELLED"
  | "INFRA_ERROR";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface CostEstimate {
  inputCostUsd: number;
  outputCostUsd: number;
  totalCostUsd: number;
}

export interface Artifact {
  name: string;
  path: string;
  sizeBytes: number;
  mimeType?: string;
  sha256?: string;
}

export interface TaskMetadata {
  id: string;
  version: string;
  name: string;
  description: string;
  category: BenchmarkCategory;
  difficulty: BenchmarkDifficulty;
  author?: string;
  tags?: string[];
  public?: boolean;
}

export interface StatisticalSummary {
  count: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  p50: number;
  p90: number;
  p95: number;
  ci95Lower: number;
  ci95Upper: number;
}
