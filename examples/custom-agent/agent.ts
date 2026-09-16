import { BaseAgentAdapter, AgentContext, AgentResult, ToolDefinition } from "@kazi-ai/agent-sdk";

export class CustomEchoAgent extends BaseAgentAdapter {
  constructor() {
    super("custom-echo-agent", "1.0.0");
  }

  public async initialize(_context: AgentContext): Promise<void> {
    console.log(`[CustomEchoAgent] Initialized in sandbox environment`);
  }

  public async step(
    observation: string,
    availableTools: ToolDefinition[]
  ): Promise<{ action: "call_tool" | "finish"; toolName?: string; toolArgs?: Record<string, unknown>; finalAnswer?: string }> {
    console.log(`[CustomEchoAgent] Received observation: ${observation.slice(0, 60)}...`);

    const hasTerminal = availableTools.some((t) => t.name === "terminal");
    if (hasTerminal) {
      return {
        action: "call_tool",
        toolName: "terminal",
        toolArgs: { cmd: "ls -la" },
      };
    }

    return {
      action: "finish",
      finalAnswer: "Task completed successfully",
    };
  }

  public async finalize(): Promise<AgentResult> {
    return {
      agentId: this.id,
      success: true,
      totalSteps: 2,
      totalTokens: { promptTokens: 120, completionTokens: 40, totalTokens: 160 },
      totalCostUsd: 0.0004,
    };
  }
}
