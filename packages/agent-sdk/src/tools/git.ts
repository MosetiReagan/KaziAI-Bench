import { AgentContext, ToolDefinition, ToolResult } from "../types.js";

export const GitTool: ToolDefinition = {
  name: "git",
  description: "Execute safe Git inspection commands (status, diff, log, branch) inside workspace.",
  parameters: {
    type: "object",
    properties: {
      subcommand: { type: "string", enum: ["status", "diff", "log", "branch", "show"] },
      args: { type: "string" },
    },
    required: ["subcommand"],
  },
  async execute(args: Record<string, unknown>, context: AgentContext): Promise<ToolResult> {
    const start = Date.now();
    const subcommand = String(args.subcommand || "status");
    const extraArgs = args.args ? ` ${String(args.args)}` : "";
    const command = `git ${subcommand}${extraArgs}`;

    const res = await context.environment.execute({
      cmd: command,
      cwd: context.workspaceDir,
      env: context.envVars,
    });

    return {
      tool: "git",
      output: (res.stdout + "\n" + res.stderr).trim(),
      isError: res.exitCode !== 0,
      durationMs: Date.now() - start,
      metadata: { exitCode: res.exitCode },
    };
  },
};
