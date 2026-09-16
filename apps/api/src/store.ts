export interface TaskRecord {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  version: string;
  description: string;
  timeoutMs: number;
  createdAt: string;
}

export interface RunRecord {
  id: string;
  taskId: string;
  agentId: string;
  modelId: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "TIMED_OUT" | "CANCELLED";
  success: boolean;
  score: number;
  totalSteps: number;
  totalDurationMs: number;
  totalCostUsd: number;
  totalTokens: number;
  failureCategory?: string;
  seed: string;
  createdAt: string;
  finishedAt?: string;
  trajectory?: Record<string, unknown>;
  metrics?: Record<string, number>;
}

export interface LeaderboardEntry {
  agentId: string;
  modelId: string;
  totalRuns: number;
  successfulRuns: number;
  passRate: number;
  averageScore: number;
  averageDurationMs: number;
  averageCostUsd: number;
}

export class MemoryStore {
  private tasks: Map<string, TaskRecord> = new Map();
  private runs: Map<string, RunRecord> = new Map();
  private apiKeys: Map<string, { role: "admin" | "user" | "read-only"; name: string }> = new Map();

  constructor() {
    // Default test API keys
    this.apiKeys.set("kazi_test_admin_key_12345", { role: "admin", name: "Default Admin" });
    this.apiKeys.set("kazi_test_user_key_67890", { role: "user", name: "Default User" });
  }

  public upsertTask(task: TaskRecord): void {
    this.tasks.set(task.id, task);
  }

  public getTask(id: string): TaskRecord | undefined {
    return this.tasks.get(id);
  }

  public listTasks(): TaskRecord[] {
    return Array.from(this.tasks.values());
  }

  public createRun(run: RunRecord): RunRecord {
    this.runs.set(run.id, run);
    return run;
  }

  public updateRun(id: string, updates: Partial<RunRecord>): RunRecord | undefined {
    const existing = this.runs.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.runs.set(id, updated);
    return updated;
  }

  public getRun(id: string): RunRecord | undefined {
    return this.runs.get(id);
  }

  public listRuns(filter?: { taskId?: string; agentId?: string; status?: string }): RunRecord[] {
    let all = Array.from(this.runs.values());
    if (filter?.taskId) all = all.filter((r) => r.taskId === filter.taskId);
    if (filter?.agentId) all = all.filter((r) => r.agentId === filter.agentId);
    if (filter?.status) all = all.filter((r) => r.status === filter.status);
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getLeaderboard(): LeaderboardEntry[] {
    const grouped = new Map<string, RunRecord[]>();
    for (const run of this.runs.values()) {
      if (run.status !== "COMPLETED" && run.status !== "FAILED") continue;
      const key = `${run.agentId}::${run.modelId}`;
      const list = grouped.get(key) || [];
      list.push(run);
      grouped.set(key, list);
    }

    const leaderboard: LeaderboardEntry[] = [];
    for (const [key, runs] of grouped.entries()) {
      const [agentId, modelId] = key.split("::");
      const totalRuns = runs.length;
      const successfulRuns = runs.filter((r) => r.success).length;
      const passRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;
      const avgScore = runs.reduce((sum, r) => sum + r.score, 0) / (totalRuns || 1);
      const avgDuration = runs.reduce((sum, r) => sum + r.totalDurationMs, 0) / (totalRuns || 1);
      const avgCost = runs.reduce((sum, r) => sum + r.totalCostUsd, 0) / (totalRuns || 1);

      leaderboard.push({
        agentId: agentId || "unknown",
        modelId: modelId || "unknown",
        totalRuns,
        successfulRuns,
        passRate: Math.round(passRate * 100) / 100,
        averageScore: Math.round(avgScore * 1000) / 1000,
        averageDurationMs: Math.round(avgDuration),
        averageCostUsd: Math.round(avgCost * 10000) / 10000,
      });
    }

    return leaderboard.sort((a, b) => b.passRate - a.passRate || b.averageScore - a.averageScore);
  }

  public validateApiKey(apiKey: string): { role: "admin" | "user" | "read-only"; name: string } | null {
    return this.apiKeys.get(apiKey) || null;
  }
}
