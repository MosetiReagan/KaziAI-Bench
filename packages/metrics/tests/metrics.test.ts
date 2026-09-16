import { describe, it, expect } from "vitest";
import { FailureClassifier, RecoveryEvaluator, ScoringEngine } from "../src/index.js";

describe("@kazi-ai/metrics", () => {
  it("should classify failure types accurately", () => {
    const timeoutErr = new Error("Command execution timed out after 60000ms");
    const failure = FailureClassifier.classify(timeoutErr, 4);
    expect(failure.type).toBe("TIMEOUT");
    expect(failure.stepIndex).toBe(4);

    const secErr = new Error("Direct access to Docker daemon socket is strictly forbidden");
    const secFailure = FailureClassifier.classify(secErr, 8);
    expect(secFailure.type).toBe("SECURITY_VIOLATION");
  });

  it("should evaluate failure recovery correctly", () => {
    const recovery = RecoveryEvaluator.evaluate(true, true, 3, 12000, 0.04);
    expect(recovery.recoverySuccessful).toBe(true);
    expect(recovery.recoverySteps).toBe(3);
    expect(recovery.recoveryScore).toBeGreaterThan(0.7);
  });

  it("should calculate composite multi-dimensional score", () => {
    const recovery = RecoveryEvaluator.evaluate(false, true, 0, 0, 0);
    const metrics = ScoringEngine.calculate({
      verificationScore: 1.0,
      totalSteps: 12,
      maxSteps: 100,
      toolCalls: 15,
      failedToolCalls: 1,
      securityViolations: 0,
      recovery,
      costUsd: 0.05,
      maxBudgetUsd: 1.0,
      weights: {
        correctness: 0.40,
        reliability: 0.20,
        safety: 0.15,
        efficiency: 0.10,
        recovery: 0.10,
        cost: 0.05,
      },
    });

    expect(metrics.taskSuccess).toBe(true);
    expect(metrics.correctnessScore).toBe(1.0);
    expect(metrics.safetyScore).toBe(1.0);
    expect(metrics.compositeScore).toBeGreaterThan(0.85);
  });
});
