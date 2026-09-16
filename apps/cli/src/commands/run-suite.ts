import path from "path";
import fs from "fs";
import pc from "picocolors";
import yaml from "yaml";
import { executeSingleTask } from "./run.js";
import { TerminalReporter } from "@kazi-ai/reporting";

export function registerRunSuiteCommand(program: any): void {
  program
    .command("run-suite <suiteName>")
    .description("Execute an entire benchmark suite (e.g. coding-v1, security-v1, kazi-bench-core-v1)")
    .option("-a, --agent <agent>", "Agent identifier", "reference")
    .option("-m, --model <model>", "Model identifier", "gpt-4o")
    .option("-s, --seed <seed>", "Base seed", "42")
    .option("-p, --parallel <num>", "Concurrency level", "1")
    .action(async (suiteName: string, opts: any) => {
      const suiteFileName = suiteName.endsWith(".yaml") ? suiteName : `${suiteName}.yaml`;
      const suitePath = path.resolve(process.cwd(), "benchmarks/suites", suiteFileName);

      if (!fs.existsSync(suitePath)) {
        console.error(pc.red(`Error: Benchmark suite '${suiteName}' not found at ${suitePath}`));
        process.exit(1);
      }

      const suiteContent = fs.readFileSync(suitePath, "utf-8");
      const suite = yaml.parse(suiteContent) as { id: string; name: string; tasks: string[] };

      console.log(pc.bold(pc.cyan(`\nStarting Suite: ${suite.name} (${suite.tasks.length} tasks)\n`)));

      const results: any[] = [];
      const total = suite.tasks.length;
      let count = 0;

      for (const taskId of suite.tasks) {
        count++;
        process.stdout.write(pc.yellow(`[${count}/${total}] Running ${taskId.padEnd(30)} ... `));

        try {
          const { result } = await executeSingleTask(taskId, {
            agent: opts.agent,
            model: opts.model,
            seed: opts.seed,
          });

          results.push(result);
          if (result.passed) {
            console.log(pc.green("✓ PASS"));
          } else {
            console.log(pc.red("✗ FAIL"));
          }
        } catch (err) {
          console.log(pc.red(`✗ ERROR: ${String(err)}`));
        }
      }

      console.log("\n" + TerminalReporter.formatSuiteSummary(results));
    });
}
