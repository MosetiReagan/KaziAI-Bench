import { EngineRunOptions, ExecutionEngine, RunResult } from "./engine.js";

export interface ParallelSuiteOptions {
  runs: EngineRunOptions[];
  concurrency: number;
  basePort?: number;
  onRunComplete?: (result: RunResult, completedCount: number, totalCount: number) => void;
}

export class ParallelRunner {
  public static async executeSuite(options: ParallelSuiteOptions): Promise<RunResult[]> {
    const { runs, concurrency = 2, onRunComplete } = options;
    const results: RunResult[] = [];
    const total = runs.length;
    let completed = 0;

    const queue = [...runs];

    const workers = Array.from({ length: Math.min(concurrency, runs.length) }, async () => {
      while (queue.length > 0) {
        const runOptions = queue.shift();
        if (!runOptions) break;

        // Clone and inject unique run configuration
        const isolatedOptions: EngineRunOptions = {
          ...runOptions,
          task: {
            ...runOptions.task,
            id: runOptions.task.id,
          },
        };

        try {
          const res = await ExecutionEngine.execute(isolatedOptions);
          results.push(res);
          completed++;
          if (onRunComplete) {
            onRunComplete(res, completed, total);
          }
        } catch (err) {
          completed++;
          // Execution engine guarantees a structured RunResult, but catch any fatal uncaught
        }
      }
    });

    await Promise.all(workers);
    return results;
  }
}
