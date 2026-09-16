import { BaseAgentAdapter } from "./base-adapter.js";
import { AgentResult } from "./types.js";

export interface HttpAgentAdapterOptions {
  id?: string;
  name?: string;
  endpointUrl: string;
  apiKey?: string;
  timeoutMs?: number;
}

export class HttpAgentAdapter extends BaseAgentAdapter {
  public readonly id: string;
  public readonly name: string;
  public readonly version = "1.0.0";
  private endpointUrl: string;
  private apiKey?: string;
  private timeoutMs: number;

  constructor(options: HttpAgentAdapterOptions) {
    super();
    this.id = options.id || "http-agent";
    this.name = options.name || "Remote HTTP Agent";
    this.endpointUrl = options.endpointUrl;
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs || 300_000;
  }

  public async execute(): Promise<AgentResult> {
    if (!this.context) {
      throw new Error("Context not initialized");
    }

    this.state = "RUNNING";

    const payload = {
      taskId: this.context.task.id,
      taskName: this.context.task.name,
      description: this.context.task.description,
      constraints: this.context.constraints,
      availableTools: Array.from(this.context.tools.keys()),
    };

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (this.apiKey) {
        headers["Authorization"] = `Bearer ${this.apiKey}`;
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(this.endpointUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`Remote HTTP agent responded with status ${response.status}: ${await response.text()}`);
      }

      const data = (await response.json()) as Partial<AgentResult>;

      this.state = "COMPLETED";
      return {
        status: data.status || "success",
        finalResponse: data.finalResponse || "Remote agent completed execution",
        steps: data.steps || 1,
        durationMs: Date.now() - this.startTime,
        tokenUsage: data.tokenUsage || { inputTokens: 1000, outputTokens: 200, totalTokens: 1200 },
        costUsd: data.costUsd || this.calculateCost(),
        toolCalls: data.toolCalls || 0,
        failedToolCalls: data.failedToolCalls || 0,
        artifacts: await this.context.environment.collectArtifacts(),
        metadata: { endpoint: this.endpointUrl, ...(data.metadata || {}) },
      };
    } catch (err) {
      this.state = "FAILED";
      return {
        status: "error",
        finalResponse: `Remote agent request failed: ${String(err)}`,
        steps: 1,
        durationMs: Date.now() - this.startTime,
        tokenUsage: this.totalTokens,
        costUsd: 0,
        toolCalls: 0,
        failedToolCalls: 1,
        artifacts: [],
        metadata: { error: String(err) },
      };
    }
  }
}
