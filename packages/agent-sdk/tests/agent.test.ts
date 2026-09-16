import { describe, it, expect } from "vitest";
import {
  ReferenceAgent,
  ToolRegistry,
  ToolGuardrail,
  McpClient,
  AgentContext,
} from "../src/index.js";
import { LocalEnvironment } from "@kazi-ai/environment-sdk";
import { parseTaskString } from "@kazi-ai/task-schema";

const DUMMY_TASK_YAML = `
id: coding.fix-auth
version: 1.0.0
name: Fix Authentication Middleware
description: Fix authentication middleware
category: coding
difficulty: medium
environment:
  type: isolated-process
verification:
  type: deterministic
  checks:
    - name: Test check
      type: command
      command: echo 'test pass'
`;

describe("@kazi-ai/agent-sdk", () => {
  it("should initialize tool registry with default tools", () => {
    const registry = ToolRegistry.getInstance();
    expect(registry.has("terminal")).toBe(true);
    expect(registry.has("filesystem")).toBe(true);
    expect(registry.has("http")).toBe(true);
    expect(registry.has("git")).toBe(true);
  });

  it("should detect loops using ToolGuardrail", async () => {
    const registry = ToolRegistry.getInstance();
    const term = registry.get("terminal")!;
    const guardrail = new ToolGuardrail({ maxConsecutiveIdenticalCalls: 3 });

    const dummyContext: any = {
      workspaceDir: process.cwd(),
      environment: { execute: async () => ({ exitCode: 0, stdout: "ok", stderr: "", durationMs: 1, timedOut: false }) },
      envVars: {},
    };

    const wrapped = await guardrail.wrapTool(term, dummyContext);

    // Call 1 & 2 pass through
    await wrapped.execute({ command: "pwd" }, dummyContext);
    await wrapped.execute({ command: "pwd" }, dummyContext);

    // Call 3 triggers loop warning
    const loopResult = await wrapped.execute({ command: "pwd" }, dummyContext);
    expect(loopResult.metadata?.loopDetected).toBe(true);
  });

  it("should discover and map MCP tools to Kazi tools", async () => {
    const mcp = new McpClient({ name: "db_service" });
    await mcp.connect();

    const tools = await mcp.listTools();
    expect(tools.length).toBeGreaterThan(0);
    expect(tools.some((t) => t.name === "db_service_query")).toBe(true);

    const kaziTools = mcp.asKaziTools();
    expect(kaziTools.length).toBe(tools.length);

    const queryTool = kaziTools.find((t) => t.name === "db_service_query")!;
    const res = await queryTool.execute({ query: "SELECT 1;" }, {} as any);
    expect(res.isError).toBe(false);
    expect(res.output).toContain("db_service");
  });

  it("should execute ReferenceAgent against an isolated environment", async () => {
    const task = parseTaskString(DUMMY_TASK_YAML);
    const env = new LocalEnvironment({ id: "test_ref_agent" });
    await env.create();

    const registry = ToolRegistry.getInstance();
    const tools = registry.getToolsForNames(["terminal", "filesystem"]);

    const context: AgentContext = {
      task,
      environment: env,
      tools,
      constraints: task.constraints,
      workspaceDir: env.workdir,
      envVars: {},
      metadata: {},
    };

    const agent = new ReferenceAgent();
    await agent.initialize(context);

    const result = await agent.execute();
    expect(result.status).toBe("success");
    expect(result.steps).toBeGreaterThan(0);
    expect(result.toolCalls).toBeGreaterThan(0);
    expect(result.durationMs).toBeGreaterThan(0);

    await agent.shutdown();
    await env.destroy();
  }, 20_000);
});
