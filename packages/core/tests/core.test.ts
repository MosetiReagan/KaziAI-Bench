import { describe, it, expect } from "vitest";
import { PricingRegistry, KaziError, InfrastructureError, SecurityViolationError } from "../src/index.js";

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
});
