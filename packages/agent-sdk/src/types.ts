import { Artifact, TokenUsage } from "@kazi-ai/core";
import { TaskConstraints, TaskDefinition } from "@kazi-ai/task-schema";
import { BenchmarkEnvironment } from "@kazi-ai/environment-sdk";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute(args: Record<string, unknown>, context: AgentContext): Promise<ToolResult>;
}

export interface ToolResult {
  tool: string;
  output: string;
  isError?: boolean;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

export interface AgentContext {
  task: TaskDefinition;
  environment: BenchmarkEnvironment;
  tools: Map<string, ToolDefinition>;
  constraints: TaskConstraints;
  workspaceDir: string;
  envVars: Record<string, string>;
  metadata: Record<string, unknown>;
  recordStep?: (step: TrajectoryStep) => void;
}

export interface TrajectoryStep {
  step: number;
  type: "thought" | "tool_call" | "tool_result" | "message" | "error";
  tool?: string;
  input?: Record<string, unknown>;
  output?: string;
  durationMs: number;
  tokens?: TokenUsage;
  timestamp: string;
}

export interface AgentResult {
  status: "success" | "failure" | "timeout" | "error";
  finalResponse?: string;
  steps: number;
  durationMs: number;
  tokenUsage: TokenUsage;
  costUsd: number;
  toolCalls: number;
  failedToolCalls: number;
  artifacts: Artifact[];
  metadata: Record<string, unknown>;
}

export interface AgentAdapter {
  readonly id: string;
  readonly name: string;
  readonly version: string;

  initialize(context: AgentContext): Promise<void>;
  execute(): Promise<AgentResult>;
  shutdown(): Promise<void>;
}
