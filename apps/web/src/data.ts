export interface BenchmarkTaskItem {
  id: string;
  name: string;
  category: "coding" | "debugging" | "database" | "security" | "terminal" | "devops" | "api" | "mcp";
  difficulty: "easy" | "medium" | "hard";
  description: string;
  timeoutSeconds: number;
}

export interface LeaderboardRow {
  rank: number;
  agent: string;
  model: string;
  passRate: number; // 0-100
  reliabilityScore: number; // 0-100
  avgDurationSec: number;
  avgCostUsd: number;
  avgTokens: number;
  recoveryRate: number; // 0-100
  runsCount: number;
}

export interface RunHistoryItem {
  id: string;
  taskId: string;
  agent: string;
  model: string;
  status: "PASSED" | "FAILED" | "TIMED_OUT";
  durationSec: number;
  costUsd: number;
  steps: number;
  seed: number | string;
  date: string;
}

export const MOCK_TASKS: BenchmarkTaskItem[] = [
  { id: "coding.fix-auth", name: "Fix Authentication Token Validation", category: "coding", difficulty: "medium", description: "Repair auth middleware token verification bypass and fix security test suites.", timeoutSeconds: 60 },
  { id: "coding.fix-pagination", name: "Fix Off-by-One Pagination Bug", category: "coding", difficulty: "easy", description: "Resolve edge-case off-by-one bug in paginated query parser.", timeoutSeconds: 30 },
  { id: "debugging.api-500", name: "Debug Nested Null Pointer 500 Error", category: "debugging", difficulty: "easy", description: "Trace and fix unhandled TypeError in user profile hydration route.", timeoutSeconds: 45 },
  { id: "debugging.worker-failure", name: "Fix Async Unhandled Promise Rejection", category: "debugging", difficulty: "medium", description: "Handle graceful retry and termination on network timeout inside background queue.", timeoutSeconds: 60 },
  { id: "database.query-optimization", name: "Optimize Event Log Query & Add Index", category: "database", difficulty: "medium", description: "Analyze SQLite EXPLAIN QUERY PLAN and add missing multi-column indexes.", timeoutSeconds: 60 },
  { id: "security.command-injection", name: "Remediate Shell Command Injection", category: "security", difficulty: "hard", description: "Sanitize user parameters and remove raw string concatenation from shell invocation.", timeoutSeconds: 90 },
  { id: "terminal.disk-diagnosis", name: "Diagnose Runaway Disk Usage & Log Cleanup", category: "terminal", difficulty: "easy", description: "Find disk hog in /var/log, truncate runaway log file and preserve rotating symlinks.", timeoutSeconds: 30 },
  { id: "devops.docker-healthcheck", name: "Fix Alpine Healthcheck Incompatibility", category: "devops", difficulty: "medium", description: "Resolve missing curl in minimal alpine image by adapting healthcheck to wget.", timeoutSeconds: 60 },
  { id: "api.webhook-idempotency", name: "Implement Idempotent Webhook Processing", category: "api", difficulty: "medium", description: "Prevent duplicate payment capture on redundant webhook deliveries using idempotency keys.", timeoutSeconds: 60 },
  { id: "mcp.tool-selection", name: "Recover from Deprecated MCP Tool Schema", category: "mcp", difficulty: "medium", description: "Inspect MCP schema definitions and migrate deprecated tool invocations.", timeoutSeconds: 60 },
];

export const MOCK_LEADERBOARD: LeaderboardRow[] = [
  { rank: 1, agent: "Kazi Reference Agent", model: "claude-3-5-sonnet-20241022", passRate: 90.0, reliabilityScore: 92.4, avgDurationSec: 14.2, avgCostUsd: 0.0084, avgTokens: 3120, recoveryRate: 85.7, runsCount: 50 },
  { rank: 2, agent: "Kazi Reference Agent", model: "gpt-4o", passRate: 80.0, reliabilityScore: 84.1, avgDurationSec: 16.8, avgCostUsd: 0.0092, avgTokens: 3840, recoveryRate: 71.4, runsCount: 50 },
  { rank: 3, agent: "LangChain ReAct", model: "gpt-4o", passRate: 70.0, reliabilityScore: 71.3, avgDurationSec: 22.4, avgCostUsd: 0.0142, avgTokens: 5200, recoveryRate: 40.0, runsCount: 40 },
  { rank: 4, agent: "AutoGPT v0.5", model: "gpt-4o-mini", passRate: 50.0, reliabilityScore: 48.6, avgDurationSec: 38.1, avgCostUsd: 0.0041, avgTokens: 7100, recoveryRate: 25.0, runsCount: 40 },
  { rank: 5, agent: "CrewAI Orchestrator", model: "claude-3-haiku", passRate: 40.0, reliabilityScore: 39.8, avgDurationSec: 29.5, avgCostUsd: 0.0038, avgTokens: 4900, recoveryRate: 20.0, runsCount: 30 },
];

export const MOCK_RUNS: RunHistoryItem[] = [
  { id: "run_01JH8A912K", taskId: "coding.fix-auth", agent: "Kazi Reference Agent", model: "claude-3-5-sonnet-20241022", status: "PASSED", durationSec: 12.4, costUsd: 0.0062, steps: 4, seed: 42, date: "10 mins ago" },
  { id: "run_01JH8A714M", taskId: "security.command-injection", agent: "Kazi Reference Agent", model: "gpt-4o", status: "PASSED", durationSec: 18.9, costUsd: 0.0112, steps: 5, seed: 108, date: "32 mins ago" },
  { id: "run_01JH8A551N", taskId: "database.query-optimization", agent: "LangChain ReAct", model: "gpt-4o", status: "PASSED", durationSec: 24.1, costUsd: 0.0154, steps: 7, seed: 42, date: "1 hr ago" },
  { id: "run_01JH8A332P", taskId: "devops.docker-healthcheck", agent: "AutoGPT v0.5", model: "gpt-4o-mini", status: "FAILED", durationSec: 60.0, costUsd: 0.0089, steps: 12, seed: 77, date: "2 hrs ago" },
  { id: "run_01JH8A110Q", taskId: "debugging.api-500", agent: "Kazi Reference Agent", model: "claude-3-5-sonnet-20241022", status: "PASSED", durationSec: 8.2, costUsd: 0.0041, steps: 3, seed: 42, date: "3 hrs ago" },
];
