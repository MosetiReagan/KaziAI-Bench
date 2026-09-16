import path from "path";
import fs from "fs";
import pc from "picocolors";
import { RegressionComparator } from "@kazi-ai/reporting";

export function registerCompareCommand(program: any): void {
  program
    .command("compare <baselineRunId> <currentRunId>")
    .description("Compare two benchmark runs to detect regressions in success, latency, or cost")
    .option("-f, --format <format>", "Output format: text or json", "text")
    .action((baselineRunId: string, currentRunId: string, options: { format: string }) => {
      const runsDir = path.resolve(process.cwd(), ".kazi/runs");
      const baseFile = path.join(runsDir, baselineRunId.endsWith(".json") ? baselineRunId : `${baselineRunId}.json`);
      const currFile = path.join(runsDir, currentRunId.endsWith(".json") ? currentRunId : `${currentRunId}.json`);

      if (!fs.existsSync(baseFile)) {
        console.error(pc.red(`Error: Baseline run file not found at ${baseFile}`));
        process.exit(1);
      }
      if (!fs.existsSync(currFile)) {
        console.error(pc.red(`Error: Current run file not found at ${currFile}`));
        process.exit(1);
      }

      const baseline = JSON.parse(fs.readFileSync(baseFile, "utf-8"));
      const current = JSON.parse(fs.readFileSync(currFile, "utf-8"));

      const comparison = RegressionComparator.compare(baseline, current);

      if (options.format === "json") {
        console.log(JSON.stringify(comparison, null, 2));
      } else {
        console.log(comparison.summaryText);
      }

      if (comparison.regressionDetected) {
        process.exitCode = 1;
      }
    });
}
