import path from "path";
import { ExecutionEngine, generateRunId } from "@kazi-ai/core";
import { loadTasksFromDirectory } from "@kazi-ai/task-schema";
import { LocalEnvironment } from "@kazi-ai/environment-sdk";
import { ReferenceAgent } from "@kazi-ai/agent-sdk";
import { VerifierDispatcher } from "@kazi-ai/verifier";
import { TrajectoryRecorder } from "@kazi-ai/tracing";

export interface BenchmarkJob {
  id: string;
  taskId: string;
  agentId: string;
  modelId: string;
  seed: string | number;
  retries: number;
  status: "queued" | "processing" | "completed" | "failed";
  error?: string;
  result?: Record<string, unknown>;
}

export class WorkerQueue {
  private queue: BenchmarkJob[] = [];
  private processing = false;
  private concurrency: number;
  private maxRetries = 2;

  constructor(concurrency = 2) {
    this.concurrency = concurrency;
  }

  public enqueue(job: Omit<BenchmarkJob, "status" | "retries">): BenchmarkJob {
    const fullJob: BenchmarkJob = {
      ...job,
      status: "queued",
      retries: 0,
    };
    this.queue.push(fullJob);
    this.processNext();
    return fullJob;
  }

  public getJob(id: string): BenchmarkJob | undefined {
    return this.queue.find((j) => j.id === id);
  }

  public getPendingCount(): number {
    return this.queue.filter((j) => j.status === "queued").length;
  }

  public getProcessingCount(): number {
    return this.queue.filter((j) => j.status === "processing").length;
  }

  private async processNext(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      while (true) {
        const active = this.queue.filter((j) => j.status === "processing").length;
        if (active >= this.concurrency) break;

        const nextJob = this.queue.find((j) => j.status === "queued");
        if (!nextJob) break;

        nextJob.status = "processing";
        this.executeJob(nextJob).catch((err) => {
          console.error(`Error in worker executing job ${nextJob.id}:`, err);
        });
      }
    } finally {
      this.processing = false;
    }
  }

  private async executeJob(job: BenchmarkJob): Promise<void> {
    try {
      const benchmarksDir = path.resolve(process.cwd(), "benchmarks");
      const tasks = loadTasksFromDirectory(benchmarksDir);
      const task = tasks.find((t) => t.id === job.taskId);

      if (!task) {
        throw new Error(`Task '${job.taskId}' not found`);
      }

      const runId = job.id || generateRunId();
      const baseDir = path.resolve(process.cwd(), ".sandbox", "worker");
      const fixturePath = task.environment.fixture_path ? path.resolve(benchmarksDir, task.environment.fixture_path) : undefined;
      
      const env = new LocalEnvironment({
        id: runId,
        baseDir,
        fixturePath,
        defaultTimeoutMs: task.constraints?.max_duration_seconds ? task.constraints.max_duration_seconds * 1000 : 30000,
      });

      const agent = new ReferenceAgent();
      const verifier = new VerifierDispatcher();
      const recorder = new TrajectoryRecorder({
        runId,
        taskId: task.id,
        agentId: job.agentId,
        modelId: job.modelId,
        seed: job.seed,
      });

      recorder.recordEvent("TASK_START", { metadata: { name: task.name, category: task.category } });

      const result = await ExecutionEngine.execute({
        runId,
        task,
        environment: env,
        agent,
        verifier,
        modelName: job.modelId,
      });

      recorder.recordEvent("TASK_END", { metadata: { status: result.status, passed: result.passed } });

      job.status = "completed";
      job.result = {
        runId: result.runId,
        success: result.passed,
        score: result.score,
        durationMs: result.durationMs,
        steps: result.steps,
      };

      await env.destroy();
    } catch (err) {
      if (job.retries < this.maxRetries) {
        job.retries++;
        job.status = "queued"; // retry
      } else {
        job.status = "failed";
        job.error = (err as Error).message;
      }
    } finally {
      this.processNext();
    }
  }
}
