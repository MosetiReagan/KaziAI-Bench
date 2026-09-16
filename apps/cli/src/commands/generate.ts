import { Command } from "commander";
import pc from "picocolors";
import fs from "fs";
import path from "path";
import yaml from "yaml";
import { loadTasksFromDirectory, generateTaskVariant } from "@kazi-ai/task-schema";

export function registerGenerateCommand(program: Command): void {
  program
    .command("generate <taskId>")
    .description("Generate deterministic, anti-gaming seeded variants of a benchmark task")
    .option("-s, --seed <seed>", "Seed value for deterministic randomization", "42")
    .option("-c, --count <number>", "Number of variants to generate", "1")
    .option("-o, --out <dir>", "Output directory to save generated YAML variants")
    .action(async (taskId: string, options: { seed: string; count: string; out?: string }) => {
      try {
        const benchmarksDir = path.resolve(process.cwd(), "benchmarks");
        const tasks = loadTasksFromDirectory(benchmarksDir);
        const baseTask = tasks.find((t) => t.id === taskId);

        if (!baseTask) {
          console.error(pc.red(`\nTask not found: ${taskId}`));
          process.exitCode = 1;
          return;
        }

        const count = parseInt(options.count, 10) || 1;
        const baseSeed = parseInt(options.seed, 10) || 42;

        console.log(pc.bold(pc.cyan(`\n  KaziAI Bench — Deterministic Task Variant Generator`)));
        console.log(pc.white(`  Base Task: ${pc.bold(baseTask.id)}`));
        console.log(pc.white(`  Variants:  ${count} (Starting seed: ${baseSeed})`));

        for (let i = 0; i < count; i++) {
          const currentSeed = baseSeed + i;
          const variant = generateTaskVariant(baseTask, { seed: currentSeed });

          console.log(pc.green(`\n  Generated variant: `) + pc.bold(variant.id));
          console.log(pc.dim(`    Seed: ${currentSeed}`));
          console.log(pc.dim(`    Randomized Port: ${variant.environment.env?.KAZI_PORT}`));
          console.log(pc.dim(`    Injected Auth Token: ${variant.environment.env?.KAZI_AUTH_TOKEN}`));

          if (options.out) {
            const outDir = path.resolve(process.cwd(), options.out);
            fs.mkdirSync(outDir, { recursive: true });
            const outPath = path.join(outDir, `${variant.id}.yaml`);
            fs.writeFileSync(outPath, yaml.stringify(variant), "utf-8");
            console.log(pc.cyan(`    Saved to: ${outPath}`));
          }
        }
        console.log("");
      } catch (err) {
        console.error(pc.red(`\nVariant generation failed: ${(err as Error).message}`));
        process.exitCode = 1;
      }
    });
}
