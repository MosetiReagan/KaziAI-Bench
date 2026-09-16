import { describe, it, expect } from "vitest";
import { TerminalReporter, MarkdownReporter, HtmlReporter, RegressionComparator } from "../src/index.js";
import { RunResult } from "@kazi-ai/core";

const mockResult: RunResult = {
  runId: "run_test_rep",
  taskId: "coding.fix-auth",
  agentId: "ref-agent",
  modelId: "gpt-4o",
  status: "COMPLETED",
  passed: true,
  score: 1.0,
  steps: 8,
  toolCalls: 12,
  durationMs: 45000,
  tokenUsage: { inputTokens: 5000, outputTokens: 800, totalTokens: 5800 },
  cost: { inputCostUsd: 0.0125, outputCostUsd: 0.008, totalCostUsd: 0.0205 },
  verification: {
    passed: true,
    score: 1.0,
    checks: [{ name: "npm test", passed: true, weight: 1.0 }],
    evidence: [],
  },
  artifacts: [],
  createdAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
};

describe("@kazi-ai/reporting", () => {
  it("should generate terminal summary", () => {
    const text = TerminalReporter.formatRunSummary(mockResult);
    expect(text).toContain("KAZIAI BENCH");
    expect(text).toContain("coding.fix-auth");
    expect(text).toContain("✓ PASS");
  });

  it("should generate markdown research report", () => {
    const md = MarkdownReporter.generateRunReport(mockResult);
    expect(md).toContain("# KaziAI Bench — Evaluation Report");
    expect(md).toContain("🟢 PASSED");
  });

  it("should generate HTML report document", () => {
    const html = HtmlReporter.generateRunHtml(mockResult);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("KaziAI Bench Report");
  });

  it("should detect regressions when comparing runs", () => {
    const degradedResult: RunResult = {
      ...mockResult,
      runId: "run_degraded",
      score: 0.6,
      durationMs: 90000,
      cost: { inputCostUsd: 0.1, outputCostUsd: 0.1, totalCostUsd: 0.2 },
    };

    const comp = RegressionComparator.compare(mockResult, degradedResult);
    expect(comp.regressionDetected).toBe(true);
    expect(comp.deltas.find((d) => d.metric === "Score")?.isRegression).toBe(true);
  });
});
