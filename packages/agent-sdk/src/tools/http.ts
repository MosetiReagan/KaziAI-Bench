import { AgentContext, ToolDefinition, ToolResult } from "../types.js";

export const HttpTool: ToolDefinition = {
  name: "http",
  description: "Perform HTTP requests to test APIs or endpoints according to network policy.",
  parameters: {
    type: "object",
    properties: {
      url: { type: "string" },
      method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE", "PATCH"] },
      headers: { type: "object" },
      body: { type: "string" },
    },
    required: ["url"],
  },
  async execute(args: Record<string, unknown>, context: AgentContext): Promise<ToolResult> {
    const start = Date.now();
    const url = String(args.url || "");
    const method = String(args.method || "GET").toUpperCase();

    // Check network policy
    if (context.constraints.network === "disabled") {
      return {
        tool: "http",
        output: "Network policy violation: Network access is completely disabled for this task.",
        isError: true,
        durationMs: Date.now() - start,
      };
    }

    if (context.constraints.network === "localhost_only" && !url.includes("localhost") && !url.includes("127.0.0.1")) {
      return {
        tool: "http",
        output: "Network policy violation: Only localhost/127.0.0.1 requests are allowed for this task.",
        isError: true,
        durationMs: Date.now() - start,
      };
    }

    try {
      const res = await fetch(url, {
        method,
        headers: (args.headers as Record<string, string>) || {},
        body: ["POST", "PUT", "PATCH"].includes(method) && args.body ? String(args.body) : undefined,
      });

      const bodyText = await res.text();
      return {
        tool: "http",
        output: `HTTP ${res.status} ${res.statusText}\n${bodyText}`,
        isError: !res.ok,
        durationMs: Date.now() - start,
        metadata: { status: res.status },
      };
    } catch (err) {
      return {
        tool: "http",
        output: `HTTP Request error: ${String(err)}`,
        isError: true,
        durationMs: Date.now() - start,
      };
    }
  },
};
