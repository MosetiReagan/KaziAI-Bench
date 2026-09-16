import { Artifact, CostEstimate, RunStatus, TokenUsage } from "./types.js";
import { PricingRegistry } from "./pricing.js";
import { InfrastructureError, TimeoutError, ResourceLimitError } from "./errors.js";

export interface BenchmarkTaskLike {
  id: string;
  version: string;
  name: string;
  description: string;
  constraints?: {
    max_duration_seconds?: number;
    max_steps?: number;
    max_tokens?: number;
    max_tool_calls?: number;
    max_cost_usd?: number;
  };
  scoring?: {
    minimum_score?: number;
    weights?: {
      correctness?: number;
      reliability?: number;
      safety?: number;
      efficiency?: number;
      recovery?: number;
      cost?: number;
    };
  };
}

export interface EnvironmentLike {
  create(): Promise<unknown>;
  reset(): Promise<void>;
  snapshot(): Promise<unknown>;
  collectArtifacts(): Promise<Artifact[]>;
  destroy(): Promise<void>;
}

export interface AgentAdapterLike {
  id: string;
  initialize(context: unknown): Promise<void>;
  execute(): Promise<{
    status: string;
    finalResponse?: string;
    steps: number;
    durationMs: number;
    tokenUsage?: TokenUsage;
    costUsd?: number;
    toolCalls: number;
    failedToolCalls?: number;
    artifacts?: Artifact[];
    metadata?: Record<string, unknown>;
  }>;
  shutdown(): Promise<void>;
}

export interface VerifierLike {
  verify(context: unknown): Promise<{
    passed: boolean;
    score: number;
    checks: unknown[];
    evidence: unknown[];
    durationMs: number;
  }>;
}

export interface RunResult {
  runId: string;
  taskId: string;
  agentId: string;
  modelId: string;
  status: RunStatus;
  passed: boolean;
  score: number;
  steps: number;
  toolCalls: number;
  durationMs: number;
  tokenUsage: TokenUsage;
  cost: CostEstimate;
  verification: {
    passed: boolean;
    score: number;
    checks: unknown[];
    evidence: unknown[];
  };
  artifacts: Artifact[];
  error?: string;
  createdAt: string;
  completedAt: string;
}

export interface EngineRunOptions {
  runId: string;
  task: BenchmarkTaskLike;
  environment: EnvironmentLike;
  agent: AgentAdapterLike;
  verifier: VerifierLike;
  modelProvider?: string;
  modelName?: string;
  onStep?: (step: unknown) => void;
}

export class ExecutionEngine {
  public static async execute(options: EngineRunOptions): Promise<RunResult> {
    const { runId, task, environment, agent, verifier } = options;
    const startTime = Date.now();
    const createdAt = new Date().toISOString();
    let status: RunStatus = "INITIALIZING";

    let agentResult: any;
    let verificationResult: any = { passed: false, score: 0, checks: [], evidence: [], durationMs: 0 };
    let collectedArtifacts: Artifact[] = [];
    let errorMessage: string | undefined;

    try {
      // 1. Create environment
      await environment.create();
      await environment.snapshot();

      // 2. Initialize agent
      status = "RUNNING";
      await agent.initialize({
        task,
        environment,
        recordStep: options.onStep,
      });

      // 3. Execute agent
      agentResult = await agent.execute();

      // 4. Verify results
      status = "VERIFYING";
      verificationResult = await verifier.verify({
        task,
        environment,
        agentResponse: agentResult.finalResponse,
      });

      // 5. Collect artifacts
      collectedArtifacts = await environment.collectArtifacts();

      status = verificationResult.passed ? "COMPLETED" : "FAILED";
    } catch (err) {
      errorMessage = String(err);
      if (err instanceof TimeoutError) status = "TIMEOUT";
      else if (err instanceof ResourceLimitError) status = "FAILED";
      else if (err instanceof InfrastructureError) status = "INFRA_ERROR";
      else status = "FAILED";
    } finally {
      // 6. Clean up environment
      try {
        await agent.shutdown();
      } catch {
        // ignore
      }
      try {
        await environment.destroy();
      } catch {
        // ignore
      }
    }

    const durationMs = Date.now() - startTime;
    const tokenUsage: TokenUsage = agentResult?.tokenUsage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

    const pricing = PricingRegistry.getInstance();
    const cost = pricing.calculateCost(
      options.modelProvider || "mock",
      options.modelName || "reference",
      tokenUsage
    );

    return {
      runId,
      taskId: task.id,
      agentId: agent.id,
      modelId: options.modelName || "default",
      status,
      passed: verificationResult.passed,
      score: verificationResult.score,
      steps: agentResult?.steps || 0,
      toolCalls: agentResult?.toolCalls || 0,
      durationMs,
      tokenUsage,
      cost,
      verification: {
        passed: verificationResult.passed,
        score: verificationResult.score,
        checks: verificationResult.checks,
        evidence: verificationResult.evidence,
      },
      artifacts: collectedArtifacts,
      error: errorMessage,
      createdAt,
      completedAt: new Date().toISOString(),
    };
  }
}
