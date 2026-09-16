import { TokenUsage } from "@kazi-ai/core";

export type EventType =
  | "TASK_START"
  | "OBSERVATION"
  | "AGENT_ACTION"
  | "TOOL_CALL"
  | "TOOL_RESULT"
  | "AGENT_THOUGHT"
  | "VERIFICATION_START"
  | "VERIFICATION_CHECK"
  | "TASK_END"
  | "ERROR";

export interface TrajectoryEvent {
  sequenceNumber: number;
  timestamp: string;
  type: EventType;
  stepIndex: number;
  durationMs: number;
  tool?: string;
  input?: Record<string, unknown>;
  output?: string;
  tokens?: TokenUsage;
  metadata?: Record<string, unknown>;
}

export interface AgentTrajectory {
  runId: string;
  taskId: string;
  agentId: string;
  modelId: string;
  seed: string | number;
  startTime: string;
  endTime?: string;
  totalDurationMs: number;
  totalSteps: number;
  totalToolCalls: number;
  totalTokens: TokenUsage;
  events: TrajectoryEvent[];
  finalResponse?: string;
}
