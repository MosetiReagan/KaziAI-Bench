import fs from "fs";
import path from "path";
import { AgentContext, ToolDefinition, ToolResult } from "../types.js";

export const FilesystemTool: ToolDefinition = {
  name: "filesystem",
  description: "Read, write, edit, or list files within the benchmark workspace.",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["read", "write", "list", "delete"] },
      path: { type: "string", description: "Relative file path within workspace" },
      content: { type: "string", description: "Content to write if action is 'write'" },
    },
    required: ["action", "path"],
  },
  async execute(args: Record<string, unknown>, context: AgentContext): Promise<ToolResult> {
    const start = Date.now();
    const action = String(args.action || "read");
    const relPath = String(args.path || "");
    const targetPath = path.resolve(context.workspaceDir, relPath);

    // Escape prevention
    if (!targetPath.startsWith(context.workspaceDir)) {
      return {
        tool: "filesystem",
        output: `Security error: Path ${relPath} attempts to escape workspace root`,
        isError: true,
        durationMs: Date.now() - start,
      };
    }

    try {
      if (action === "read") {
        if (!fs.existsSync(targetPath)) {
          return { tool: "filesystem", output: `File not found: ${relPath}`, isError: true, durationMs: Date.now() - start };
        }
        const content = fs.readFileSync(targetPath, "utf-8");
        return { tool: "filesystem", output: content, isError: false, durationMs: Date.now() - start };
      }

      if (action === "write") {
        const parentDir = path.dirname(targetPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        fs.writeFileSync(targetPath, String(args.content ?? ""), "utf-8");
        return { tool: "filesystem", output: `Successfully wrote ${relPath}`, isError: false, durationMs: Date.now() - start };
      }

      if (action === "list") {
        const dirToRead = fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory() ? targetPath : context.workspaceDir;
        const entries = fs.readdirSync(dirToRead);
        return { tool: "filesystem", output: entries.join("\n"), isError: false, durationMs: Date.now() - start };
      }

      if (action === "delete") {
        if (fs.existsSync(targetPath)) {
          fs.rmSync(targetPath, { recursive: true, force: true });
          return { tool: "filesystem", output: `Deleted ${relPath}`, isError: false, durationMs: Date.now() - start };
        }
        return { tool: "filesystem", output: `File not found: ${relPath}`, isError: true, durationMs: Date.now() - start };
      }

      return { tool: "filesystem", output: `Unsupported action: ${action}`, isError: true, durationMs: Date.now() - start };
    } catch (err) {
      return {
        tool: "filesystem",
        output: `Filesystem error: ${String(err)}`,
        isError: true,
        durationMs: Date.now() - start,
      };
    }
  },
};
