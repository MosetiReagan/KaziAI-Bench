import { RunResult } from "@kazi-ai/core";

export interface MetricDelta {
  metric: string;
  baseline: number;
  current: number;
  delta: number;
  pctChange: number;
  isRegression: boolean;
}

export interface ComparisonReport {
  baselineRunId: string;
  currentRunId: string;
  regressionDetected: boolean;
  deltas: MetricDelta[];
  summaryText: string;
}

export class RegressionComparator {
  public static compare(
    baseline: RunResult,
    current: RunResult,
    thresholds: {
      maxSuccessDelta?: number; // e.g. -0.05 (-5%)
      maxCostIncreasePct?: number; // e.g. 0.20 (+20%)
      maxLatencyIncreasePct?: number; // e.g. 0.25 (+25%)
    } = {}
  ): ComparisonReport {
    const maxSuccessDelta = thresholds.maxSuccessDelta ?? -0.05;
    const maxCostIncreasePct = thresholds.maxCostIncreasePct ?? 0.20;
    const maxLatencyIncreasePct = thresholds.maxLatencyIncreasePct ?? 0.25;

    const deltas: MetricDelta[] = [];
    let regressionDetected = false;

    // 1. Score / Success Delta
    const scoreDelta = current.score - baseline.score;
    const scoreRegression = scoreDelta < maxSuccessDelta;
    if (scoreRegression) regressionDetected = true;
    deltas.push({
      metric: "Score",
      baseline: baseline.score,
      current: current.score,
      delta: Number(scoreDelta.toFixed(4)),
      pctChange: baseline.score > 0 ? Number(((scoreDelta / baseline.score) * 100).toFixed(1)) : 0,
      isRegression: scoreRegression,
    });

    // 2. Latency / Duration Delta
    const latDelta = current.durationMs - baseline.durationMs;
    const latPct = baseline.durationMs > 0 ? latDelta / baseline.durationMs : 0;
    const latRegression = latPct > maxLatencyIncreasePct;
    if (latRegression) regressionDetected = true;
    deltas.push({
      metric: "Latency (ms)",
      baseline: baseline.durationMs,
      current: current.durationMs,
      delta: latDelta,
      pctChange: Number((latPct * 100).toFixed(1)),
      isRegression: latRegression,
    });

    // 3. Cost Delta
    const costDelta = current.cost.totalCostUsd - baseline.cost.totalCostUsd;
    const costPct = baseline.cost.totalCostUsd > 0 ? costDelta / baseline.cost.totalCostUsd : 0;
    const costRegression = costPct > maxCostIncreasePct;
    if (costRegression) regressionDetected = true;
    deltas.push({
      metric: "Cost (USD)",
      baseline: baseline.cost.totalCostUsd,
      current: current.cost.totalCostUsd,
      delta: Number(costDelta.toFixed(4)),
      pctChange: Number((costPct * 100).toFixed(1)),
      isRegression: costRegression,
    });

    // Summary formatting
    const lines = [
      "==================================================",
      "             RUN COMPARISON REPORT                ",
      "==================================================",
      `Baseline: ${baseline.runId} (${baseline.agentId})`,
      `Current:  ${current.runId} (${current.agentId})`,
      `Status:   ${regressionDetected ? "⚠️ REGRESSION DETECTED" : "✅ NO REGRESSION DETECTED"}`,
      "--------------------------------------------------",
    ];

    for (const d of deltas) {
      const icon = d.isRegression ? "❌" : "✓";
      const sign = d.delta >= 0 ? "+" : "";
      lines.push(`${icon} ${d.metric.padEnd(16)} Baseline: ${d.baseline} -> Current: ${d.current} (${sign}${d.pctChange}%)`);
    }

    lines.push("==================================================");

    return {
      baselineRunId: baseline.runId,
      currentRunId: current.runId,
      regressionDetected,
      deltas,
      summaryText: lines.join("\n"),
    };
  }
}
