#!/usr/bin/env node
import { Command } from "commander";
import pc from "picocolors";
import { BENCHMARK_NAME, BENCHMARK_VERSION } from "@kazi-ai/core";

import { registerListCommand } from "./commands/list.js";
import { registerInfoCommand } from "./commands/info.js";
import { registerRunCommand } from "./commands/run.js";
import { registerRunSuiteCommand } from "./commands/run-suite.js";

export const program = new Command();

program
  .name("kazi-bench")
  .description(pc.bold(pc.cyan(`${BENCHMARK_NAME} — The Agent Reliability Benchmark`)))
  .version(BENCHMARK_VERSION);

registerListCommand(program);
registerInfoCommand(program);
registerRunCommand(program);
registerRunSuiteCommand(program);

// Entrypoint
if (process.argv[1] && (process.argv[1].endsWith("dist/index.js") || process.argv[1].endsWith("src/index.ts") || process.argv[1].endsWith("kazi-bench"))) {
  program.parse(process.argv);
}
