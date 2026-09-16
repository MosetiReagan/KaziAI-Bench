import path from "path";
import pc from "picocolors";
import { loadTasksFromDirectory } from "@kazi-ai/task-schema";

export function registerListCommand(program: any): void {
  program
    .command("list")
    .description("List all available benchmark tasks")
    .option("-c, --category <category>", "Filter tasks by category")
    .option("-f, --format <format>", "Output format: table or json", "table")
    .action((options: { category?: string; format: string }) => {
      const benchmarksDir = path.resolve(process.cwd(), "benchmarks");
      let tasks = loadTasksFromDirectory(benchmarksDir);

      if (options.category) {
        tasks = tasks.filter((t) => t.category.toLowerCase() === options.category?.toLowerCase());
      }

      if (options.format === "json") {
        console.log(JSON.stringify(tasks, null, 2));
        return;
      }

      console.log(pc.bold(pc.cyan("\nAvailable KaziAI Benchmark Tasks:")));
      console.log(pc.gray("--------------------------------------------------------------------------------"));
      console.log(
        `${pc.bold("ID".padEnd(30))} ${pc.bold("Category".padEnd(14))} ${pc.bold("Difficulty".padEnd(12))} ${pc.bold("Name")}`
      );
      console.log(pc.gray("--------------------------------------------------------------------------------"));

      for (const t of tasks) {
        const diffColor =
          t.difficulty === "easy"
            ? pc.green
            : t.difficulty === "medium"
            ? pc.yellow
            : pc.red;

        console.log(
          `${pc.cyan(t.id.padEnd(30))} ${t.category.padEnd(14)} ${diffColor(t.difficulty.padEnd(12))} ${t.name}`
        );
      }
      console.log(pc.gray("--------------------------------------------------------------------------------"));
      console.log(pc.gray(`Total: ${tasks.length} task(s)\n`));
    });
}
