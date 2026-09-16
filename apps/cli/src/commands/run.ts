import path from "path";
import fs from "fs";
import pc from "picocolors";
import yaml from "yaml";
import { ExecutionEngine, generateRunId, captureRunMetadata } from "@kazi-ai/core";
import { loadTasksFromDirectory } from "@kazi-ai/task-schema";
import { LocalEnvironment } from "@kazi-ai/environment-sdk";
import { DockerSandbox } from "@kazi-ai/sandbox";
import { ReferenceAgent, ToolRegistry, ToolGuardrail, HttpAgentAdapter } from "@kazi-ai/agent-sdk";
import { VerifierDispatcher } from "@kazi-ai/verifier";
import { ScoringEngine, RecoveryEvaluator } from "@kazi-ai/metrics";
import { TrajectoryRecorder, TrajectoryStorage } from "@kazi-ai/tracing";
import { TerminalReporter } from "@kazi-ai/reporting";

export async function executeSingleTask(taskId: string, options: {
  agent?: string;
  model?: string;
  seed?: string | number;
  docker?: boolean;
  httpEndpoint?: string;
}): Promise<any> {
  const benchmarksDir = path.resolve(process.cwd(), "benchmarks");
  const tasks = loadTasksFromDirectory(benchmarksDir);
  const task = tasks.find((t) => t.id === taskId);

  if (!task) {
    throw new Error(`Task '${taskId}' not found`);
  }

  const seed = options.seed || 42;
  const runId = generateRunId();
  const runMeta = captureRunMetadata(runId, seed);

  // Initialize Environment
  const fixtureAbsPath = task.environment.fixture_path
    ? path.resolve(process.cwd(), task.environment.fixture_path)
    : undefined;

  const env = options.docker
    ? new DockerSandbox({ id: runId, image: task.environment.image, fixturePath: fixtureAbsPath })
    : new LocalEnvironment({ id: runId, fixturePath: fixtureAbsPath });

  // Initialize Agent
  let agentInstance: any;
  if (options.httpEndpoint) {
    agentInstance = new HttpAgentAdapter({ endpointUrl: options.httpEndpoint });
  } else {
    agentInstance = new ReferenceAgent();
  }

  // Trajectory & Storage
  const recorder = new TrajectoryRecorder({
    runId,
    taskId: task.id,
    agentId: agentInstance.id,
    modelId: options.model || "gpt-4o",
    seed,
  });

  const toolRegistry = ToolRegistry.getInstance();
  const rawTools = toolRegistry.getToolsForNames(task.agent.tools || ["terminal", "filesystem"]);
  const guardrail = new ToolGuardrail({ maxToolCalls: task.constraints.max_tool_calls });

  // Wrap tools with guardrails & trajectory recording
  const wrappedTools = new Map();
  for (const [name, tool] of rawTools.entries()) {
    const guarded = await guardrail.wrapTool(tool, {} as any);
    wrappedTools.set(name, {
      ...guarded,
      execute: async (args: any, ctx: any) => {
        recorder.recordEvent("TOOL_CALL", {
          tool: name,
          input: args,
          stepIndex: recorder.getEvents().length + 1,
        });
        const res = await guarded.execute(args, ctx);
        recorder.recordEvent("TOOL_RESULT", {
          tool: name,
          output: res.output,
          durationMs: res.durationMs,
        });
        return res;
      },
    });
  }

  const verifier = new VerifierDispatcher();

  // Execute engine
  recorder.recordEvent("TASK_START", { metadata: { name: task.name, category: task.category } });

  const result = await ExecutionEngine.execute({
    runId,
    task,
    environment: env,
    agent: agentInstance,
    verifier,
    modelName: options.model || "default",
    onStep: (s: any) => {
      recorder.recordEvent("AGENT_ACTION", { input: s });
    },
  });

  recorder.recordEvent("TASK_END", { metadata: { status: result.status, passed: result.passed } });
  const trajectory = recorder.finalize();

  // Evaluate Multi-Dimensional Metrics
  const recovery = RecoveryEvaluator.evaluate(false, result.passed, 0, 0, 0);
  const metrics = ScoringEngine.calculate({
    verificationScore: result.score,
    totalSteps: result.steps,
    maxSteps: task.constraints.max_steps,
    toolCalls: result.toolCalls,
    failedToolCalls: 0,
    securityViolations: 0,
    recovery,
    costUsd: result.cost.totalCostUsd,
    weights: task.scoring.weights,
  });

  // Persist Run & Trajectory to .kazi/runs/
  const runsDir = path.resolve(process.cwd(), ".kazi/runs");
  if (!fs.existsSync(runsDir)) fs.mkdirSync(runsDir, { recursive: true });

  const storage = new TrajectoryStorage();
  storage.saveJson(path.join(runsDir, `${runId}.trajectory.json`), trajectory);

  const runRecord = {
    ...result,
    metrics,
    systemMetadata: runMeta,
  };
  fs.writeFileSync(path.join(runsDir, `${runId}.json`), JSON.stringify(runRecord, null, 2), "utf-8");

  return { result, metrics, runRecord };
}

export function registerRunCommand(program: any): void {
  program
    .command("run <taskId>")
    .description("Execute an agent evaluation against a specific benchmark task")
    .option("-a, --agent <agent>", "Agent identifier to use", "reference")
    .option("-m, --model <model>", "Model identifier", "gpt-4o")
    .option("-s, --seed <seed>", "Deterministic random seed", "42")
    .option("--docker", "Execute task inside Docker container sandbox instead of isolated process")
    .option("--endpoint <url>", "Remote agent HTTP endpoint")
    .action(async (taskId: string, opts: any) => {
      console.log(pc.cyan(`\nStarting KaziAI Bench execution for task '${taskId}'...\n`));
      try {
        const { result, metrics } = await executeSingleTask(taskId, {
          agent: opts.agent,
          model: opts.model,
          seed: opts.seed,
          docker: opts.docker,
          httpEndpoint: opts.endpoint,
        });

        const summary = TerminalReporter.formatRunSummary(result, metrics);
        console.log(summary);
      } catch (err) {
        console.error(pc.red(`\nBenchmark run failed: ${String(err)}`));
        process.exit(1);
      }
    });
}
