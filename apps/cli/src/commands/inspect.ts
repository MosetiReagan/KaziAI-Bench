import { Command } from "commander";
import pc from "picocolors";
import { TrajectoryStorage, AgentTrajectory, TrajectoryEvent } from "@kazi-ai/tracing";

export function registerInspectCommand(program: Command): void {
  program
    .command("inspect <trajectoryFile>")
    .description("Inspect step-by-step tool calls, thoughts, and evidence from a run trajectory")
    .option("-s, --step <number>", "Inspect a specific step index")
    .option("-r, --raw", "Print raw JSON trajectory", false)
    .action(async (trajectoryFile: string, options: { step?: string; raw: boolean }) => {
      try {
        const storage = new TrajectoryStorage();
        const trajectory: AgentTrajectory = storage.loadJson(trajectoryFile);

        if (options.raw) {
          console.log(JSON.stringify(trajectory, null, 2));
          return;
        }

        console.log(pc.bold(pc.cyan(`\n  KaziAI Bench — Trajectory Inspector`)));
        console.log(pc.white(`  Run ID:      ${pc.bold(trajectory.runId)}`));
        console.log(pc.white(`  Task ID:     ${trajectory.taskId}`));
        console.log(pc.white(`  Agent ID:    ${trajectory.agentId}`));
        console.log(pc.white(`  Start Time:  ${trajectory.startTime}`));
        console.log(pc.white(`  Total Steps: ${trajectory.totalSteps}`));
        console.log(pc.white(`  Events:      ${trajectory.events.length}`));

        if (options.step !== undefined) {
          const stepIdx = parseInt(options.step, 10);
          const event = trajectory.events.find((e: TrajectoryEvent) => e.stepIndex === stepIdx);
          if (!event) {
            console.error(pc.red(`  Event/Step ${stepIdx} not found in trajectory.`));
            process.exitCode = 1;
            return;
          }
          console.log(pc.bold(pc.yellow(`\n  --- Step ${event.stepIndex} [${event.type}] ---`)));
          if (event.tool) console.log(pc.cyan(`  Tool:     ${event.tool}`));
          console.log(pc.dim(`  Duration: ${event.durationMs}ms`));
          if (event.input) {
            console.log(pc.white(`  Input:`));
            console.log(pc.dim(JSON.stringify(event.input, null, 2)));
          }
          if (event.output) {
            console.log(pc.white(`  Output:`));
            console.log(pc.dim(event.output));
          }
          return;
        }

        console.log(pc.bold(pc.white(`\n  Execution Timeline:`)));
        for (const event of trajectory.events) {
          const toolTag = event.tool ? pc.cyan(`[${event.tool}]`) : pc.magenta(`[${event.type}]`);
          const durTag = pc.dim(`${event.durationMs}ms`);
          console.log(`    ${pc.bold(`#${event.sequenceNumber}`)} ${toolTag} ${durTag}`);
          if (event.output) {
            const preview = event.output.replace(/\n/g, " ").slice(0, 70);
            console.log(pc.dim(`       ↳ ${preview}${event.output.length > 70 ? "..." : ""}`));
          }
        }
        console.log("");
      } catch (err) {
        console.error(pc.red(`\nInspect failed: ${(err as Error).message}`));
        process.exitCode = 1;
      }
    });
}
