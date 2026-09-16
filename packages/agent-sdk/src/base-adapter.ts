import { PricingRegistry, TokenUsage } from "@kazi-ai/core";
import { AgentAdapter, AgentContext, AgentResult, TrajectoryStep } from "./types.js";

export type AdapterLifecycleState =
  | "UNINITIALIZED"
  | "INITIALIZED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "TIMEOUT"
  | "TERMINATED";

export abstract class BaseAgentAdapter implements AgentAdapter {
  public abstract readonly id: string;
  public abstract readonly name: string;
  public abstract readonly version: string;

  protected context?: AgentContext;
  protected state: AdapterLifecycleState = "UNINITIALIZED";
  protected totalTokens: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  protected toolCalls = 0;
  protected failedToolCalls = 0;
  protected stepCount = 0;
  protected startTime = 0;
  protected modelProvider = "mock";
  protected modelName = "reference";

  public async initialize(context: AgentContext): Promise<void> {
    if (this.state !== "UNINITIALIZED") {
      throw new Error(`Cannot initialize adapter in state: ${this.state}`);
    }
    this.context = context;
    this.state = "INITIALIZED";
    this.totalTokens = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    this.toolCalls = 0;
    this.failedToolCalls = 0;
    this.stepCount = 0;
    this.startTime = Date.now();
  }

  public abstract execute(): Promise<AgentResult>;

  public async shutdown(): Promise<void> {
    this.state = "TERMINATED";
  }

  public getState(): AdapterLifecycleState {
    return this.state;
  }

  protected recordStep(
    type: TrajectoryStep["type"],
    details: {
      tool?: string;
      input?: Record<string, unknown>;
      output?: string;
      durationMs?: number;
      tokens?: TokenUsage;
    }
  ): void {
    this.stepCount++;
    if (details.tokens) {
      this.totalTokens.inputTokens += details.tokens.inputTokens;
      this.totalTokens.outputTokens += details.tokens.outputTokens;
      this.totalTokens.totalTokens += details.tokens.totalTokens;
    }

    if (this.context?.recordStep) {
      this.context.recordStep({
        step: this.stepCount,
        type,
        tool: details.tool,
        input: details.input,
        output: details.output,
        durationMs: details.durationMs || 0,
        tokens: details.tokens,
        timestamp: new Date().toISOString(),
      });
    }
  }

  protected calculateCost(): number {
    const pricing = PricingRegistry.getInstance();
    const estimate = pricing.calculateCost(this.modelProvider, this.modelName, this.totalTokens);
    return estimate.totalCostUsd;
  }
}
