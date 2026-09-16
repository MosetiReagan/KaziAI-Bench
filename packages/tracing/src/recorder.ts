import { TokenUsage } from "@kazi-ai/core";
import { AgentTrajectory, EventType, TrajectoryEvent } from "./types.js";

export interface TrajectoryRecorderOptions {
  runId: string;
  taskId: string;
  agentId: string;
  modelId: string;
  seed: string | number;
}

export class TrajectoryRecorder {
  private runId: string;
  private taskId: string;
  private agentId: string;
  private modelId: string;
  private seed: string | number;
  private startTime: string;
  private events: TrajectoryEvent[] = [];
  private sequence = 0;
  private totalTokens: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  private toolCallCount = 0;
  private finalResponse?: string;

  constructor(options: TrajectoryRecorderOptions) {
    this.runId = options.runId;
    this.taskId = options.taskId;
    this.agentId = options.agentId;
    this.modelId = options.modelId;
    this.seed = options.seed;
    this.startTime = new Date().toISOString();
  }

  public recordEvent(
    type: EventType,
    details: {
      stepIndex?: number;
      durationMs?: number;
      tool?: string;
      input?: Record<string, unknown>;
      output?: string;
      tokens?: TokenUsage;
      metadata?: Record<string, unknown>;
    }
  ): TrajectoryEvent {
    this.sequence++;
    if (type === "TOOL_CALL") {
      this.toolCallCount++;
    }

    if (details.tokens) {
      this.totalTokens.inputTokens += details.tokens.inputTokens;
      this.totalTokens.outputTokens += details.tokens.outputTokens;
      this.totalTokens.totalTokens += details.tokens.totalTokens;
    }

    const event: TrajectoryEvent = {
      sequenceNumber: this.sequence,
      timestamp: new Date().toISOString(),
      type,
      stepIndex: details.stepIndex || 0,
      durationMs: details.durationMs || 0,
      tool: details.tool,
      input: details.input,
      output: details.output,
      tokens: details.tokens,
      metadata: details.metadata,
    };

    this.events.push(event);
    return event;
  }

  public setFinalResponse(response: string): void {
    this.finalResponse = response;
  }

  public finalize(): AgentTrajectory {
    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(this.startTime).getTime();

    return {
      runId: this.runId,
      taskId: this.taskId,
      agentId: this.agentId,
      modelId: this.modelId,
      seed: this.seed,
      startTime: this.startTime,
      endTime,
      totalDurationMs: duration,
      totalSteps: this.events.length,
      totalToolCalls: this.toolCallCount,
      totalTokens: { ...this.totalTokens },
      events: [...this.events],
      finalResponse: this.finalResponse,
    };
  }

  public getEvents(): readonly TrajectoryEvent[] {
    return this.events;
  }
}
