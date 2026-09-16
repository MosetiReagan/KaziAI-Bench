import { ResourceLimitError } from "@kazi-ai/core";
import { AgentContext, ToolDefinition, ToolResult } from "./types.js";

export interface GuardrailOptions {
  maxToolCalls?: number;
  maxConsecutiveIdenticalCalls?: number;
}

export class ToolGuardrail {
  private callCount = 0;
  private maxCalls: number;
  private maxConsecutiveIdenticalCalls: number;
  private lastCallSignature = "";
  private consecutiveIdenticalCalls = 0;

  constructor(options: GuardrailOptions = {}) {
    this.maxCalls = options.maxToolCalls || 200;
    this.maxConsecutiveIdenticalCalls = options.maxConsecutiveIdenticalCalls || 5;
  }

  public async wrapTool(tool: ToolDefinition, context: AgentContext): Promise<ToolDefinition> {
    return {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      execute: async (args: Record<string, unknown>, ctx: AgentContext): Promise<ToolResult> => {
        this.callCount++;
        if (this.callCount > this.maxCalls) {
          throw new ResourceLimitError(`Maximum tool call limit of ${this.maxCalls} exceeded. Execution aborted.`);
        }

        const signature = `${tool.name}:${JSON.stringify(args)}`;
        if (signature === this.lastCallSignature) {
          this.consecutiveIdenticalCalls++;
          if (this.consecutiveIdenticalCalls >= this.maxConsecutiveIdenticalCalls) {
            return {
              tool: tool.name,
              output: `Guardrail warning: Detected loop - tool '${tool.name}' called with identical arguments ${this.consecutiveIdenticalCalls} times in succession. Change your approach.`,
              isError: true,
              durationMs: 0,
              metadata: { loopDetected: true },
            };
          }
        } else {
          this.lastCallSignature = signature;
          this.consecutiveIdenticalCalls = 1;
        }

        return tool.execute(args, ctx);
      },
    };
  }

  public getCallCount(): number {
    return this.callCount;
  }
}
