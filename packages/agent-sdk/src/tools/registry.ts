import { ToolDefinition } from "../types.js";
import { TerminalTool } from "./terminal.js";
import { FilesystemTool } from "./filesystem.js";
import { HttpTool } from "./http.js";
import { GitTool } from "./git.js";

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, ToolDefinition> = new Map();

  private constructor() {
    this.registerDefaultTools();
  }

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  private registerDefaultTools(): void {
    this.register(TerminalTool);
    this.register(FilesystemTool);
    this.register(HttpTool);
    this.register(GitTool);
  }

  public register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  public get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  public has(name: string): boolean {
    return this.tools.has(name);
  }

  public getToolsForNames(names: string[]): Map<string, ToolDefinition> {
    const map = new Map<string, ToolDefinition>();
    for (const name of names) {
      const tool = this.tools.get(name);
      if (tool) {
        map.set(name, tool);
      }
    }
    return map;
  }

  public getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }
}
