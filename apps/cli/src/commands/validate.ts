import { Command } from "commander";
import pc from "picocolors";
import fs from "fs";
import path from "path";
import { validateTaskDefinition, loadTasksFromDirectory } from "@kazi-ai/task-schema";
import yaml from "yaml";

export function registerValidateCommand(program: Command): void {
  program
    .command("validate [targetPath]")
    .description("Validate task definitions, schema compliance, and fixture integrity")
    .option("-s, --strict", "Fail on minor warnings", false)
    .action(async (targetPath?: string, _options?: { strict: boolean }) => {
      try {
        const target = targetPath ? path.resolve(process.cwd(), targetPath) : path.resolve(process.cwd(), "benchmarks");

        console.log(pc.bold(pc.cyan(`\n  KaziAI Bench — Task Schema & Fixture Validator`)));
        console.log(pc.dim(`  Validating target: ${target}`));

        let tasksToValidate: Array<{ filePath: string; raw: unknown }> = [];

        if (fs.existsSync(target) && fs.statSync(target).isFile()) {
          const content = fs.readFileSync(target, "utf-8");
          const parsed = target.endsWith(".json") ? JSON.parse(content) : yaml.parse(content);
          tasksToValidate.push({ filePath: target, raw: parsed });
        } else if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
          const loaded = loadTasksFromDirectory(target);
          tasksToValidate = loaded.map((t) => ({ filePath: `task:${t.id}`, raw: t }));
        } else {
          console.error(pc.red(`  Path not found: ${target}`));
          process.exitCode = 1;
          return;
        }

        let passed = 0;
        let failed = 0;

        for (const item of tasksToValidate) {
          const result = validateTaskDefinition(item.raw);
          if (result.valid && result.task) {
            console.log(pc.green(`  ✓ [VALID] `) + pc.bold(result.task.id) + pc.dim(` (${result.task.category} / ${result.task.difficulty})`));
            passed++;
          } else {
            console.log(pc.red(`  ✗ [INVALID] `) + pc.bold(item.filePath));
            for (const err of result.errors) {
              console.log(pc.red(`    - ${err}`));
            }
            failed++;
          }
        }

        console.log(`\n  Summary: ${pc.green(`${passed} passed`)}, ${failed > 0 ? pc.red(`${failed} failed`) : pc.dim("0 failed")}\n`);
        if (failed > 0) {
          process.exitCode = 1;
        }
      } catch (err) {
        console.error(pc.red(`\nValidation failed: ${(err as Error).message}`));
        process.exitCode = 1;
      }
    });
}
