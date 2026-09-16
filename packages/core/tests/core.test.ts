import { describe, it, expect } from "vitest";
import {
  PricingRegistry,
  KaziError,
  InfrastructureError,
  SecurityViolationError,
  ExecutionEngine,
  generateRunId,
  captureRunMetadata,
  StatisticalAnalyzer,
  BudgetEnforcer,
  CancellationRegistry,
} from "../src/index.js";

describe("@kazi-ai/core", () => {
  it("should calculate model pricing correctly", () => {
    const registry = PricingRegistry.getInstance();
    const cost = registry.calculateCost("openai", "gpt-4o", {
      inputTokens: 10_000,
      outputTokens: 5_000,
      totalTokens: 15_000,
    });

    expect(cost.inputCostUsd).toBeCloseTo(0.025, 4);
    expect(cost.outputCostUsd).toBeCloseTo(0.05, 4);
    expect(cost.totalCostUsd).toBeCloseTo(0.075, 4);
  });

  it("should classify error hierarchies properly", () => {
    const infraErr = new InfrastructureError("Redis connection lost");
    expect(infraErr.kind).toBe("INFRASTRUCTURE_FAILURE");
    expect(infraErr instanceof KaziError).toBe(true);

    const secErr = new SecurityViolationError("Unauthorized port access");
    expect(secErr.kind).toBe("SECURITY_VIOLATION");
    expect(secErr instanceof KaziError).toBe(true);
  });

  it("should generate valid run IDs and capture environment metadata", () => {
    const runId = generateRunId();
    expect(runId.startsWith("run_01J")).toBe(true);
    expect(runId.length).toBeGreaterThan(15);

    const meta = captureRunMetadata(runId, 12345);
    expect(meta.runId).toBe(runId);
    expect(meta.seed).toBe(12345);
    expect(meta.nodeVersion).toBe(process.version);
  });

  it("should compute accurate statistical summaries and confidence intervals", () => {
    const scores = [0.8, 0.85, 0.9, 0.95, 1.0];
    const stats = StatisticalAnalyzer.summarize(scores);

    expect(stats.count).toBe(5);
    expect(stats.mean).toBe(0.9);
    expect(stats.median).toBe(0.9);
    expect(stats.p50).toBe(0.9);
    expect(stats.min).toBe(0.8);
    expect(stats.max).toBe(1.0);
    expect(stats.ci95Lower).toBeLessThan(stats.mean);
    expect(stats.ci95Upper).toBeGreaterThan(stats.mean);
  });

  it("should manage cancellation tokens", () => {
    const registry = CancellationRegistry.getInstance();
    const token = registry.createToken("run_cancel_test");

    let wasCancelled = false;
    token.onCancelled(() => {
      wasCancelled = true;
    });

    expect(token.isCancelled).toBe(false);
    registry.cancelRun("run_cancel_test");
    expect(token.isCancelled).toBe(true);
    expect(wasCancelled).toBe(true);
  });

  it("should execute engine pipeline end-to-end with mock components", async () => {
    let created = false;
    let destroyed = false;

    const mockEnv = {
      create: async () => { created = true; },
      reset: async () => {},
      snapshot: async () => ({ id: "snap" }),
      collectArtifacts: async () => [{ name: "diff.patch", path: "/tmp/diff", sizeBytes: 120 }],
      destroy: async () => { destroyed = true; },
    };

    const mockAgent = {
      id: "mock-agent",
      initialize: async () => {},
      execute: async () => ({
        status: "success",
        finalResponse: "All tests green",
        steps: 4,
        durationMs: 150,
        tokenUsage: { inputTokens: 500, outputTokens: 100, totalTokens: 600 },
        toolCalls: 3,
      }),
      shutdown: async () => {},
    };

    const mockVerifier = {
      verify: async () => ({
        passed: true,
        score: 1.0,
        checks: [{ name: "test-pass", passed: true, score: 1.0, weight: 1.0 }],
        evidence: [{ name: "evidence-1", details: "All assertions passed" }],
        durationMs: 50,
      }),
    };

    const result = await ExecutionEngine.execute({
      runId: "run_e2e_test",
      task: {
        id: "coding.fix-auth",
        version: "1.0.0",
        name: "Fix Auth",
        description: "Fix auth",
      },
      environment: mockEnv,
      agent: mockAgent,
      verifier: mockVerifier,
    });

    expect(created).toBe(true);
    expect(destroyed).toBe(true);
    expect(result.status).toBe("COMPLETED");
    expect(result.passed).toBe(true);
    expect(result.score).toBe(1.0);
    expect(result.steps).toBe(4);
    expect(result.artifacts.length).toBe(1);
    expect(result.cost.totalCostUsd).toBeGreaterThan(0);
  });
});
