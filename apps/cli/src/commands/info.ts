import path from "path";
import pc from "picocolors";
import { loadTasksFromDirectory } from "@kazi-ai/task-schema";

export function registerInfoCommand(program: any): void {
  program
    .command("info <taskId>")
    .description("Display detailed specification for a benchmark task")
    .option("-f, --format <format>", "Output format: text or json", "text")
    .action((taskId: string, options: { format: string }) => {
      const benchmarksDir = path.resolve(process.cwd(), "benchmarks");
      const tasks = loadTasksFromDirectory(benchmarksDir);
      const task = tasks.find((t) => t.id === taskId);

      if (!task) {
        console.error(pc.red(`Error: Task '${taskId}' not found in benchmarks.`));
        process.exit(1);
      }

      if (options.format === "json") {
        console.log(JSON.stringify(task, null, 2));
        return;
      }

      console.log(pc.bold(pc.cyan(`\n=== Task Specification: ${task.name} ===`)));
      console.log(`${pc.bold("ID:")}            ${task.id}`);
      console.log(`${pc.bold("Version:")}       ${task.version}`);
      console.log(`${pc.bold("Category:")}      ${task.category}`);
      console.log(`${pc.bold("Difficulty:")}    ${task.difficulty}`);
      console.log(`${pc.bold("Description:")}   ${task.description.trim()}`);
      console.log(`${pc.bold("Environment:")}   ${task.environment.type} (${task.environment.image || "native"})`);
      console.log(`${pc.bold("Network:")}       ${task.constraints.network}`);
      console.log(`${pc.bold("Max Duration:")}  ${task.constraints.max_duration_seconds}s`);
      console.log(`${pc.bold("Max Steps:")}     ${task.constraints.max_steps}`);
      console.log(`${pc.bold("Available Tools:")} ${task.agent.tools.join(", ")}`);
      console.log(pc.bold("\nVerification Checks:"));
      for (const c of task.verification.checks) {
        console.log(`  • [${c.type.toUpperCase()}] ${c.name} (weight: ${c.weight})`);
      }
      console.log("");
    });
}
