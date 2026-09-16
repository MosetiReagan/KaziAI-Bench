import { Command } from "commander";
import pc from "picocolors";
import fs from "fs";
import path from "path";
import { DatasetExporter, DatasetRecord } from "@kazi-ai/dataset";
import { TrajectoryStorage } from "@kazi-ai/tracing";

export function registerExportCommand(program: Command): void {
  program
    .command("export <sourceDir> <outputFile>")
    .description("Export completed benchmark run trajectories into JSONL dataset for KaziAI Forge")
    .option("-f, --format <format>", "Export format: jsonl or json", "jsonl")
    .action(async (sourceDir: string, outputFile: string, options: { format: string }) => {
      try {
        const resolvedSource = path.resolve(process.cwd(), sourceDir);
        const resolvedOutput = path.resolve(process.cwd(), outputFile);

        console.log(pc.bold(pc.cyan(`\n  KaziAI Bench — Dataset Exporter`)));
        console.log(pc.dim(`  Source: ${resolvedSource}`));
        console.log(pc.dim(`  Output: ${resolvedOutput}`));

        if (!fs.existsSync(resolvedSource)) {
          console.error(pc.red(`\nSource directory not found: ${resolvedSource}`));
          process.exitCode = 1;
          return;
        }

        const files = fs.readdirSync(resolvedSource).filter((f) => f.endsWith(".json"));
        console.log(pc.white(`  Found ${files.length} trajectory files to export.`));

        const storage = new TrajectoryStorage();
        const records: DatasetRecord[] = [];

        for (const file of files) {
          try {
            const traj = storage.loadJson(path.join(resolvedSource, file));
            records.push({
              task_id: traj.taskId,
              task_version: "1.0.0",
              agent: traj.agentId,
              model: traj.modelId,
              seed: traj.seed,
              success: true, // evaluated runs
              score: 1.0,
              trajectory: traj.events,
              metrics: {
                totalSteps: traj.totalSteps,
                durationMs: traj.totalDurationMs,
                totalTokens: traj.totalTokens,
              },
              verification: {},
              exported_at: new Date().toISOString(),
            });
          } catch {
            // skip unparseable files
          }
        }

        if (options.format === "json") {
          DatasetExporter.exportToJson(records, resolvedOutput);
        } else {
          DatasetExporter.exportToJsonl(records, resolvedOutput);
        }

        console.log(pc.green(`\n  ✓ Successfully exported ${records.length} records to ${resolvedOutput}\n`));
      } catch (err) {
        console.error(pc.red(`\nExport failed: ${(err as Error).message}`));
        process.exitCode = 1;
      }
    });
}
