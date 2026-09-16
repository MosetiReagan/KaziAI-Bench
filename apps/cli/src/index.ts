#!/usr/bin/env node
import { Command } from "commander";
import pc from "picocolors";
import { BENCHMARK_NAME, BENCHMARK_VERSION } from "@kazi-ai/core";

export const program = new Command();

program
  .name("kazi-bench")
  .description(pc.bold(pc.cyan(`${BENCHMARK_NAME} — The Agent Reliability Benchmark`)))
  .version(BENCHMARK_VERSION);

// Entrypoint
if (process.argv[1] && process.argv[1].endsWith("dist/index.js")) {
  program.parse(process.argv);
}
