import { Command } from "commander";
import pc from "picocolors";
import { CancellationRegistry } from "@kazi-ai/core";

export function registerCancelCommand(program: Command): void {
  program
    .command("cancel <runId>")
    .description("Signal graceful cancellation to an in-flight benchmark run")
    .action(async (runId: string) => {
      try {
        const registry = CancellationRegistry.getInstance();
        const cancelled = registry.cancelRun(runId);

        if (cancelled) {
          console.log(pc.green(`\n  ✓ Cancellation signal sent to active run: ${pc.bold(runId)}\n`));
        } else {
          console.log(pc.yellow(`\n  ⚠ Run ${pc.bold(runId)} is not currently registered as active or has already terminated.\n`));
        }
      } catch (err) {
        console.error(pc.red(`\nCancel failed: ${(err as Error).message}`));
        process.exitCode = 1;
      }
    });
}
