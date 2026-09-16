import { Command } from "commander";
import pc from "picocolors";
import path from "path";
import { TrajectoryStorage, TrajectoryReplayEngine, AgentTrajectory } from "@kazi-ai/tracing";
import { LocalEnvironment } from "@kazi-ai/environment-sdk";

export function registerReplayCommand(program: Command): void {
  program
    .command("replay <trajectoryFile>")
    .description("Replay a previously recorded agent trajectory against a clean sandbox")
    .option("-s, --sandbox <dir>", "Sandbox root directory", ".sandbox/replay")
    .option("-m, --strict", "Fail immediately on first step output divergence", false)
    .action(async (trajectoryFile: string, options: { sandbox: string; strict: boolean }) => {
      try {
        console.log(pc.bold(pc.cyan(`\n  KaziAI Bench — Trajectory Replay`)));
        console.log(pc.dim(`  Loading trajectory from: ${trajectoryFile}`));

        const storage = new TrajectoryStorage();
        const trajectory: AgentTrajectory = storage.loadJson(trajectoryFile);

        console.log(pc.white(`  Run ID:    ${pc.bold(trajectory.runId)}`));
        console.log(pc.white(`  Task ID:   ${trajectory.taskId}`));
        console.log(pc.white(`  Agent ID:  ${trajectory.agentId}`));
        console.log(pc.white(`  Events:    ${trajectory.events.length}`));

        const baseDir = path.resolve(process.cwd(), options.sandbox);
        const env = new LocalEnvironment({
          id: `replay_${trajectory.runId}`,
          baseDir,
          defaultTimeoutMs: 30000,
        });

        await env.create();

        console.log(pc.cyan(`\n  [Replaying commands against isolated environment...]`));
        const result = await TrajectoryReplayEngine.replay(trajectory, env);

        if (!result.diverged) {
          console.log(pc.bold(pc.green(`\n  ✓ Replay identical: All ${result.totalStepsReplayed} steps matched recorded trajectory.`)));
        } else {
          console.log(pc.bold(pc.yellow(`\n  ⚠ Divergence detected in trajectory replay:`)));
          for (const diff of result.diffs) {
            if (!diff.matched) {
              console.log(pc.red(`    Step ${diff.step} [${diff.tool}]: output diverged`));
              console.log(pc.dim(`      Original: ${diff.originalOutput.slice(0, 100)}`));
              console.log(pc.dim(`      Replay:   ${diff.replayOutput.slice(0, 100)}`));
            }
          }
          if (options.strict) {
            process.exitCode = 1;
          }
        }

        await env.destroy();
      } catch (err) {
        console.error(pc.red(`\nReplay failed: ${(err as Error).message}`));
        process.exitCode = 1;
      }
    });
}
