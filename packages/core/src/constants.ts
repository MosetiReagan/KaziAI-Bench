export const BENCHMARK_NAME = "KaziAI Bench";
export const BENCHMARK_VERSION = "1.0.0";
export const CLI_NAME = "kazi-bench";

export const DEFAULT_TIMEOUT_SECONDS = 900;
export const DEFAULT_MAX_STEPS = 100;
export const DEFAULT_MAX_TOKENS = 100_000;
export const DEFAULT_MAX_TOOL_CALLS = 200;

export const CATEGORIES = [
  "coding",
  "terminal",
  "database",
  "debugging",
  "security",
  "devops",
  "api",
  "mcp",
  "research"
] as const;

export type BenchmarkCategory = typeof CATEGORIES[number];

export const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;
export type BenchmarkDifficulty = typeof DIFFICULTIES[number];
