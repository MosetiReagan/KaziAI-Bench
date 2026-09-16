import { BenchmarkEnvironment } from "@kazi-ai/environment-sdk";
import { TaskDefinition } from "@kazi-ai/task-schema";

export interface Evidence {
  name: string;
  category: string;
  details: string;
  passed: boolean;
  timestamp: string;
}

export interface VerificationCheckResult {
  checkId: string;
  name: string;
  passed: boolean;
  score: number;
  weight: number;
  expected: string;
  actual: string;
  evidence: string;
  durationMs: number;
  hidden?: boolean;
}

export interface VerificationResult {
  passed: boolean;
  score: number;
  checks: VerificationCheckResult[];
  evidence: Evidence[];
  durationMs: number;
  metadata?: Record<string, unknown>;
}

export interface VerificationContext {
  task: TaskDefinition;
  environment: BenchmarkEnvironment;
  workspaceDir: string;
  agentResponse?: string;
  envVars: Record<string, string>;
}

export interface Verifier {
  readonly name: string;
  verify(context: VerificationContext): Promise<VerificationResult>;
}
