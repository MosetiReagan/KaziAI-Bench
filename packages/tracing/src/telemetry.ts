export interface TelemetrySpan {
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, unknown>;
  status: "ok" | "error";
}

export class TelemetryCollector {
  private static instance: TelemetryCollector;
  private spans: TelemetrySpan[] = [];
  private counters: Map<string, number> = new Map([
    ["benchmark_runs_total", 0],
    ["benchmark_success_total", 0],
    ["benchmark_failure_total", 0],
    ["agent_tool_calls_total", 0],
    ["verification_failures_total", 0],
    ["sandbox_failures_total", 0],
  ]);

  public static getInstance(): TelemetryCollector {
    if (!TelemetryCollector.instance) {
      TelemetryCollector.instance = new TelemetryCollector();
    }
    return TelemetryCollector.instance;
  }

  public incrementCounter(name: string, value = 1): void {
    const curr = this.counters.get(name) || 0;
    this.counters.set(name, curr + value);
  }

  public getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }

  public startSpan(name: string, attributes: Record<string, unknown> = {}): TelemetrySpan {
    const span: TelemetrySpan = {
      name,
      startTime: Date.now(),
      attributes,
      status: "ok",
    };
    this.spans.push(span);
    return span;
  }

  public endSpan(span: TelemetrySpan, status: "ok" | "error" = "ok", extraAttributes: Record<string, unknown> = {}): void {
    span.endTime = Date.now();
    span.status = status;
    span.attributes = { ...span.attributes, ...extraAttributes };
  }

  public getPrometheusMetrics(): string {
    const lines: string[] = [
      "# HELP benchmark_runs_total Total benchmark runs executed",
      "# TYPE benchmark_runs_total counter",
    ];

    for (const [key, val] of this.counters.entries()) {
      lines.push(`${key} ${val}`);
    }

    return lines.join("\n") + "\n";
  }
}
