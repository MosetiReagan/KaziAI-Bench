import { StatisticalSummary } from "./types.js";

export class StatisticalAnalyzer {
  public static summarize(values: number[]): StatisticalSummary {
    if (values.length === 0) {
      return {
        count: 0,
        mean: 0,
        median: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        ci95Lower: 0,
        ci95Upper: 0,
      };
    }

    const n = values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;

    // Median
    const mid = Math.floor(n / 2);
    const median = n % 2 !== 0 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;

    // Variance & Standard Deviation
    const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n > 1 ? n - 1 : 1);
    const stdDev = Math.sqrt(variance);

    // Percentiles
    const p50 = this.percentile(sorted, 0.50);
    const p90 = this.percentile(sorted, 0.90);
    const p95 = this.percentile(sorted, 0.95);

    // 95% Confidence Interval
    const standardError = stdDev / Math.sqrt(n);
    const marginOfError = 1.96 * standardError;
    const ci95Lower = Number(Math.max(0, mean - marginOfError).toFixed(4));
    const ci95Upper = Number((mean + marginOfError).toFixed(4));

    return {
      count: n,
      mean: Number(mean.toFixed(4)),
      median: Number(median.toFixed(4)),
      stdDev: Number(stdDev.toFixed(4)),
      min: Number(sorted[0]!.toFixed(4)),
      max: Number(sorted[n - 1]!.toFixed(4)),
      p50: Number(p50.toFixed(4)),
      p90: Number(p90.toFixed(4)),
      p95: Number(p95.toFixed(4)),
      ci95Lower,
      ci95Upper,
    };
  }

  private static percentile(sorted: number[], p: number): number {
    const idx = (sorted.length - 1) * p;
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    if (lower === upper) return sorted[lower]!;
    return sorted[lower]! * (1 - weight) + sorted[upper]! * weight;
  }
}
