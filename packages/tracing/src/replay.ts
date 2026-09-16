import { BenchmarkEnvironment } from "@kazi-ai/environment-sdk";
import { AgentTrajectory, TrajectoryEvent } from "./types.js";

export interface ReplayDiff {
  step: number;
  tool?: string;
  originalOutput: string;
  replayOutput: string;
  matched: boolean;
}

export interface ReplayResult {
  runId: string;
  diverged: boolean;
  totalStepsReplayed: number;
  diffs: ReplayDiff[];
  durationMs: number;
}

export class TrajectoryReplayEngine {
  public static async replay(
    originalTrajectory: AgentTrajectory,
    environment: BenchmarkEnvironment
  ): Promise<ReplayResult> {
    const start = Date.now();
    const diffs: ReplayDiff[] = [];
    let diverged = false;
    let stepsReplayed = 0;

    for (const event of originalTrajectory.events) {
      if (event.type === "TOOL_CALL" && event.tool === "terminal" && event.input?.command) {
        stepsReplayed++;
        const cmd = String(event.input.command);

        const execRes = await environment.execute({ cmd });
        const replayOutput = (execRes.stdout + "\n" + execRes.stderr).trim();
        const originalOutput = (event.output || "").trim();

        const matched = originalOutput === replayOutput;
        if (!matched) {
          diverged = true;
        }

        diffs.push({
          step: event.stepIndex,
          tool: event.tool,
          originalOutput,
          replayOutput,
          matched,
        });
      }
    }

    return {
      runId: originalTrajectory.runId,
      diverged,
      totalStepsReplayed: stepsReplayed,
      diffs,
      durationMs: Date.now() - start,
    };
  }
}
