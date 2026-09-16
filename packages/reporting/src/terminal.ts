import { RunResult } from "@kazi-ai/core";
import { MultiDimensionalMetrics } from "@kazi-ai/metrics";

export class TerminalReporter {
  public static formatRunSummary(result: RunResult, metrics?: MultiDimensionalMetrics): string {
    const statusSymbol = result.passed ? "✓ PASS" : "✗ FAIL";
    const durationSec = (result.durationMs / 1000).toFixed(1);
    const costStr = `$${result.cost.totalCostUsd.toFixed(4)}`;

    const lines: string[] = [
      "==================================================",
      "                 KAZIAI BENCH                     ",
      "==================================================",
      `Task:        ${result.taskId}`,
      `Agent:       ${result.agentId}`,
      `Model:       ${result.modelId}`,
      `Status:      ${result.status} (${statusSymbol})`,
      "--------------------------------------------------",
    ];

    if (metrics) {
      lines.push(
        `Correctness: ${(metrics.correctnessScore * 100).toFixed(1)}%`,
        `Reliability: ${(metrics.reliabilityScore * 100).toFixed(1)}%`,
        `Safety:      ${(metrics.safetyScore * 100).toFixed(1)}%`,
        `Recovery:    ${(metrics.recoveryScore * 100).toFixed(1)}%`,
        `Overall:     ${(metrics.compositeScore * 100).toFixed(1)}%`,
        "--------------------------------------------------"
      );
    }

    lines.push(
      `Steps:       ${result.steps}`,
      `Tool Calls:  ${result.toolCalls}`,
      `Duration:    ${durationSec}s`,
      `Tokens:      ${result.tokenUsage.totalTokens.toLocaleString()}`,
      `Cost:        ${costStr}`,
      "--------------------------------------------------",
      "Verification:"
    );

    if (result.verification.checks && Array.isArray(result.verification.checks)) {
      for (const check of result.verification.checks as any[]) {
        const icon = check.passed ? "✓" : "✗";
        lines.push(`  ${icon} ${check.name || "Check"}`);
      }
    } else {
      lines.push(`  ${result.passed ? "✓" : "✗"} Task verifier assertions`);
    }

    lines.push(
      "--------------------------------------------------",
      `Run ID:      ${result.runId}`,
      "=================================================="
    );

    return lines.join("\n");
  }

  public static formatSuiteSummary(results: RunResult[]): string {
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : "0.0";
    const totalTokens = results.reduce((acc, r) => acc + r.tokenUsage.totalTokens, 0);
    const totalCost = results.reduce((acc, r) => acc + r.cost.totalCostUsd, 0);

    const lines: string[] = [
      "==================================================",
      "           BENCHMARK SUITE SUMMARY                ",
      "==================================================",
      `Total Tasks: ${total}`,
      `Passed:      ${passed}`,
      `Failed:      ${total - passed}`,
      `Success Rate:${rate}%`,
      `Total Cost:  $${totalCost.toFixed(4)}`,
      `Total Tokens:${totalTokens.toLocaleString()}`,
      "--------------------------------------------------",
    ];

    for (const r of results) {
      const mark = r.passed ? "✓" : "✗";
      lines.push(`${mark} ${r.taskId.padEnd(28)} | Score: ${(r.score * 100).toFixed(0)}% | ${(r.durationMs / 1000).toFixed(1)}s`);
    }

    lines.push("==================================================");
    return lines.join("\n");
  }
}
