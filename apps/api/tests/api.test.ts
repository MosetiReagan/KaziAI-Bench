import { describe, it, expect } from "vitest";
import { createServer } from "../src/server.js";
import { MemoryStore } from "../src/store.js";

describe("KaziAI Bench API Integration Tests", () => {
  it("should return health status", async () => {
    const server = createServer();
    const res = await server.inject({
      method: "GET",
      url: "/health",
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.body);
    expect(json.status).toBe("ok");
    expect(json.service).toBe("kazi-api");
  });

  it("should list available benchmark tasks", async () => {
    const server = createServer();
    const res = await server.inject({
      method: "GET",
      url: "/api/v1/tasks",
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.body);
    expect(json.total).toBeGreaterThanOrEqual(1);
    expect(json.tasks.some((t: any) => t.id === "coding.fix-auth")).toBe(true);
  });

  it("should return 404 for unknown task", async () => {
    const server = createServer();
    const res = await server.inject({
      method: "GET",
      url: "/api/v1/tasks/non-existent-task",
    });

    expect(res.statusCode).toBe(404);
  });

  it("should reject unauthenticated run creation", async () => {
    const server = createServer();
    const res = await server.inject({
      method: "POST",
      url: "/api/v1/runs",
      payload: { taskId: "coding.fix-auth" },
    });

    expect(res.statusCode).toBe(401);
  });

  it("should allow authenticated run creation and retrieve run details", async () => {
    const store = new MemoryStore();
    const server = createServer(store);

    const res = await server.inject({
      method: "POST",
      url: "/api/v1/runs",
      headers: {
        "x-api-key": "kazi_test_admin_key_12345",
      },
      payload: {
        taskId: "coding.fix-auth",
        agentId: "my-custom-agent",
        modelId: "claude-3-5-sonnet",
      },
    });

    expect(res.statusCode).toBe(201);
    const json = JSON.parse(res.body);
    expect(json.run).toBeDefined();
    expect(json.run.taskId).toBe("coding.fix-auth");
    expect(json.run.agentId).toBe("my-custom-agent");
    expect(json.run.status).toBe("QUEUED");

    // Fetch the run
    const getRes = await server.inject({
      method: "GET",
      url: `/api/v1/runs/${json.run.id}`,
    });

    expect(getRes.statusCode).toBe(200);
    const getJson = JSON.parse(getRes.body);
    expect(getJson.run.id).toBe(json.run.id);
  });

  it("should return leaderboards computed from completed runs", async () => {
    const store = new MemoryStore();
    const server = createServer(store);

    store.createRun({
      id: "run_test_1",
      taskId: "coding.fix-auth",
      agentId: "AgentAlpha",
      modelId: "gpt-4o",
      status: "COMPLETED",
      success: true,
      score: 1.0,
      totalSteps: 4,
      totalDurationMs: 1500,
      totalCostUsd: 0.005,
      totalTokens: 1200,
      seed: "42",
      createdAt: new Date().toISOString(),
    });

    store.createRun({
      id: "run_test_2",
      taskId: "coding.fix-auth",
      agentId: "AgentBeta",
      modelId: "claude-3-5-sonnet",
      status: "COMPLETED",
      success: false,
      score: 0.4,
      totalSteps: 6,
      totalDurationMs: 2500,
      totalCostUsd: 0.009,
      totalTokens: 1800,
      seed: "42",
      createdAt: new Date().toISOString(),
    });

    const res = await server.inject({
      method: "GET",
      url: "/api/v1/leaderboard",
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.body);
    expect(json.leaderboard.length).toBe(2);
    expect(json.leaderboard[0].agentId).toBe("AgentAlpha");
    expect(json.leaderboard[0].passRate).toBe(100);
    expect(json.leaderboard[1].agentId).toBe("AgentBeta");
    expect(json.leaderboard[1].passRate).toBe(0);
  });
});
