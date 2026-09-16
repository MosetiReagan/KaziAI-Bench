import { AgentContext, ToolDefinition, ToolResult } from "../types.js";

export const TerminalTool: ToolDefinition = {
  name: "terminal",
  description: "Execute a shell command inside the task workspace environment.",
  parameters: {
    type: "object",
    properties: {
      command: { type: "string", description: "The command line string to run" },
      timeoutMs: { type: "number", description: "Optional execution timeout in milliseconds" },
    },
    required: ["command"],
  },
  async execute(args: Record<string, unknown>, context: AgentContext): Promise<ToolResult> {
    const start = Date.now();
    const command = String(args.command || "");
    const timeoutMs = typeof args.timeoutMs === "number" ? args.timeoutMs : 60_000;

    const result = await context.environment.execute({
      cmd: command,
      timeoutMs,
      cwd: context.workspaceDir,
      env: context.envVars,
    });

    const output = result.error ? `${result.stdout}\n${result.stderr}\n${result.error}` : `${result.stdout}\n${result.stderr}`.trim();

    return {
      tool: "terminal",
      output,
      isError: result.exitCode !== 0 || result.timedOut,
      durationMs: Date.now() - start,
      metadata: {
        exitCode: result.exitCode,
        timedOut: result.timedOut,
      },
    };
  },
};
