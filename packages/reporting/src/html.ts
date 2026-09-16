import { RunResult } from "@kazi-ai/core";
import { MultiDimensionalMetrics } from "@kazi-ai/metrics";

export class HtmlReporter {
  public static generateRunHtml(result: RunResult, metrics?: MultiDimensionalMetrics): string {
    const statusColor = result.passed ? "#10b981" : "#ef4444";
    const statusText = result.passed ? "PASSED" : "FAILED";
    const scorePct = metrics ? (metrics.compositeScore * 100).toFixed(1) : (result.score * 100).toFixed(1);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>KaziAI Bench Report - ${result.runId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; }
    .container { max-width: 960px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 2rem; border: 1px solid #334155; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 1rem; margin-bottom: 2rem; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: bold; background: ${statusColor}; color: white; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .card { background: #0f172a; border-radius: 8px; padding: 1rem; border: 1px solid #334155; }
    .card-title { font-size: 0.85rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .card-value { font-size: 1.5rem; font-weight: bold; margin-top: 0.5rem; color: #38bdf8; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #334155; }
    th { color: #94a3b8; }
    pre { background: #090d16; padding: 1rem; border-radius: 6px; overflow-x: auto; color: #a7f3d0; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 style="margin: 0; font-size: 1.75rem;">KaziAI Bench Report</h1>
        <div style="color: #94a3b8; font-size: 0.9rem; margin-top: 0.25rem;">Run ID: ${result.runId}</div>
      </div>
      <span class="badge">${statusText}</span>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-title">Score</div>
        <div class="card-value">${scorePct}%</div>
      </div>
      <div class="card">
        <div class="card-title">Duration</div>
        <div class="card-value">${(result.durationMs / 1000).toFixed(1)}s</div>
      </div>
      <div class="card">
        <div class="card-title">Steps / Tool Calls</div>
        <div class="card-value">${result.steps} / ${result.toolCalls}</div>
      </div>
      <div class="card">
        <div class="card-title">Cost</div>
        <div class="card-value">$${result.cost.totalCostUsd.toFixed(4)}</div>
      </div>
    </div>

    <h2>Verification Checks</h2>
    <table>
      <thead>
        <tr><th>Status</th><th>Check</th><th>Weight</th></tr>
      </thead>
      <tbody>
        ${
          Array.isArray(result.verification.checks)
            ? (result.verification.checks as any[])
                .map(
                  (c) =>
                    `<tr><td>${c.passed ? "✅ PASS" : "❌ FAIL"}</td><td>${c.name}</td><td>${c.weight}</td></tr>`
                )
                .join("")
            : `<tr><td colspan="3">${result.passed ? "✅ Passed" : "❌ Failed"}</td></tr>`
        }
      </tbody>
    </table>
  </div>
</body>
</html>`;
  }
}
