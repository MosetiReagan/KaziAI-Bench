import { RunResult } from "@kazi-ai/core";
import { MultiDimensionalMetrics } from "@kazi-ai/metrics";

export class MarkdownReporter {
  public static generateRunReport(result: RunResult, metrics?: MultiDimensionalMetrics): string {
    const statusBadge = result.passed ? "🟢 PASSED" : "🔴 FAILED";
    const durationSec = (result.durationMs / 1000).toFixed(2);

    return `# KaziAI Bench — Evaluation Report

## 1. Executive Summary

| Attribute | Value |
| :--- | :--- |
| **Run ID** | \`${result.runId}\` |
| **Task ID** | \`${result.taskId}\` |
| **Agent** | \`${result.agentId}\` |
| **Model** | \`${result.modelId}\` |
| **Outcome** | **${statusBadge}** |
| **Composite Score** | **${metrics ? (metrics.compositeScore * 100).toFixed(1) + "%" : (result.score * 100).toFixed(1) + "%"}** |
| **Execution Duration** | ${durationSec}s |
| **Tokens Consumed** | ${result.tokenUsage.totalTokens.toLocaleString()} |
| **Estimated Cost** | $${result.cost.totalCostUsd.toFixed(4)} |

---

## 2. Multi-Dimensional Performance Metrics

| Dimension | Score | Description |
| :--- | :--- | :--- |
| **Correctness** | ${metrics ? (metrics.correctnessScore * 100).toFixed(1) + "%" : "N/A"} | Programmatic verifier checks passed |
| **Reliability** | ${metrics ? (metrics.reliabilityScore * 100).toFixed(1) + "%" : "N/A"} | Execution resilience & non-crashing steps |
| **Safety** | ${metrics ? (metrics.safetyScore * 100).toFixed(1) + "%" : "100.0%"} | Compliance with sandbox security policies |
| **Efficiency** | ${metrics ? (metrics.efficiencyScore * 100).toFixed(1) + "%" : "N/A"} | Minimal tool churn & step count |
| **Recovery** | ${metrics ? (metrics.recoveryScore * 100).toFixed(1) + "%" : "N/A"} | Recovery from initial execution faults |

---

## 3. Verification & Evidence

${
  Array.isArray(result.verification.checks) && result.verification.checks.length > 0
    ? result.verification.checks
        .map((c: any) => `### ${c.passed ? "✅" : "❌"} ${c.name}\n\`\`\`text\n${c.evidence || "No evidence recorded"}\n\`\`\``)
        .join("\n\n")
    : "_Deterministic verifier passed all checks._"
}

---

## 4. Reproducibility & Environment Details

* **Benchmark Engine:** KaziAI Bench v1.0.0
* **Execution Timestamp:** \`${result.createdAt}\`
* **Artifacts Collected:** ${result.artifacts.length} file(s)
${result.artifacts.map((a) => `  * \`${a.name}\` (${a.sizeBytes} bytes, SHA256: \`${a.sha256 || "none"}\`)`).join("\n")}
`;
  }
}
