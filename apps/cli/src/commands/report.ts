import path from "path";
import fs from "fs";
import pc from "picocolors";
import { TerminalReporter, MarkdownReporter, HtmlReporter } from "@kazi-ai/reporting";

export function registerReportCommand(program: any): void {
  program
    .command("report <runId>")
    .description("Generate an evaluation report in terminal, Markdown, or HTML format")
    .option("-f, --format <format>", "Output format: terminal, markdown, html, json", "terminal")
    .option("-o, --output <filePath>", "Output file path")
    .action((runId: string, options: { format: string; output?: string }) => {
      const runsDir = path.resolve(process.cwd(), ".kazi/runs");
      const runFile = path.join(runsDir, runId.endsWith(".json") ? runId : `${runId}.json`);

      if (!fs.existsSync(runFile)) {
        console.error(pc.red(`Error: Run record not found at ${runFile}`));
        process.exit(1);
      }

      const runRecord = JSON.parse(fs.readFileSync(runFile, "utf-8"));
      let outputContent = "";

      switch (options.format.toLowerCase()) {
        case "markdown":
        case "md":
          outputContent = MarkdownReporter.generateRunReport(runRecord, runRecord.metrics);
          break;
        case "html":
          outputContent = HtmlReporter.generateRunHtml(runRecord, runRecord.metrics);
          break;
        case "json":
          outputContent = JSON.stringify(runRecord, null, 2);
          break;
        case "terminal":
        default:
          outputContent = TerminalReporter.formatRunSummary(runRecord, runRecord.metrics);
          break;
      }

      if (options.output) {
        const dest = path.resolve(process.cwd(), options.output);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, outputContent, "utf-8");
        console.log(pc.green(`Report written to: ${dest}`));
      } else {
        console.log(outputContent);
      }
    });
}
