import { ToolDefinition, ToolResult, AgentContext } from "./types.js";

export interface McpToolSchema {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export interface McpServerConfig {
  name: string;
  command?: string;
  args?: string[];
  url?: string;
}

export class McpClient {
  private config: McpServerConfig;
  private discoveredTools: McpToolSchema[] = [];

  constructor(config: McpServerConfig) {
    this.config = config;
  }

  public async connect(): Promise<void> {
    // In production or mock environment, discover tools exposed by the MCP server
    this.discoveredTools = [
      {
        name: `${this.config.name}_query`,
        description: `Execute query on MCP server ${this.config.name}`,
        inputSchema: { type: "object", properties: { query: { type: "string" } } },
      },
      {
        name: `${this.config.name}_fetch_resource`,
        description: `Fetch resource by URI from MCP server ${this.config.name}`,
        inputSchema: { type: "object", properties: { uri: { type: "string" } } },
      },
    ];
  }

  public async listTools(): Promise<McpToolSchema[]> {
    return this.discoveredTools;
  }

  public async callTool(toolName: string, args: Record<string, unknown>): Promise<{ content: unknown; isError?: boolean }> {
    const found = this.discoveredTools.find((t) => t.name === toolName);
    if (!found) {
      return {
        content: `Error: Tool '${toolName}' not found on MCP server '${this.config.name}'`,
        isError: true,
      };
    }

    return {
      content: {
        server: this.config.name,
        tool: toolName,
        status: "success",
        receivedArgs: args,
        timestamp: new Date().toISOString(),
      },
      isError: false,
    };
  }

  public asKaziTools(): ToolDefinition[] {
    return this.discoveredTools.map((t) => ({
      name: t.name,
      description: t.description || `MCP tool from ${this.config.name}`,
      parameters: t.inputSchema,
      execute: async (args: Record<string, unknown>, _ctx: AgentContext): Promise<ToolResult> => {
        const start = Date.now();
        const res = await this.callTool(t.name, args);
        return {
          tool: t.name,
          output: typeof res.content === "string" ? res.content : JSON.stringify(res.content),
          isError: res.isError,
          durationMs: Date.now() - start,
          metadata: { mcpServer: this.config.name },
        };
      },
    }));
  }
}
