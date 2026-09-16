import { FastifyInstance } from "fastify";
import { MemoryStore, RunRecord } from "../store.js";
import { requireAuth } from "../auth.js";
import { generateRunId } from "@kazi-ai/core";

export function registerRunRoutes(app: FastifyInstance, store: MemoryStore): void {
  // List runs
  app.get("/api/v1/runs", async (request) => {
    const query = request.query as { taskId?: string; agentId?: string; status?: string };
    const runs = store.listRuns(query);
    return {
      total: runs.length,
      runs,
    };
  });

  // Get run details
  app.get("/api/v1/runs/:id", async (request, reply) => {
    const params = request.params as { id: string };
    const run = store.getRun(params.id);
    if (!run) {
      return reply.status(404).send({ error: `Run '${params.id}' not found` });
    }
    return { run };
  });

  // Get run trajectory
  app.get("/api/v1/runs/:id/trajectory", async (request, reply) => {
    const params = request.params as { id: string };
    const run = store.getRun(params.id);
    if (!run) {
      return reply.status(404).send({ error: `Run '${params.id}' not found` });
    }
    return {
      runId: run.id,
      taskId: run.taskId,
      trajectory: run.trajectory || { events: [] },
    };
  });

  // Submit / create run (requires auth: user or admin)
  app.post("/api/v1/runs", { preHandler: [requireAuth(store, ["admin", "user"])] }, async (request, reply) => {
    const body = request.body as {
      taskId: string;
      agentId?: string;
      modelId?: string;
      seed?: string;
    };

    if (!body.taskId) {
      return reply.status(400).send({ error: "Missing required parameter 'taskId'" });
    }

    const task = store.getTask(body.taskId);
    if (!task) {
      return reply.status(404).send({ error: `Task '${body.taskId}' does not exist` });
    }

    const runId = generateRunId();
    const newRun: RunRecord = {
      id: runId,
      taskId: body.taskId,
      agentId: body.agentId || "reference-agent",
      modelId: body.modelId || "mock-gpt-4o",
      seed: body.seed || "42",
      status: "QUEUED",
      success: false,
      score: 0.0,
      totalSteps: 0,
      totalDurationMs: 0,
      totalCostUsd: 0.0,
      totalTokens: 0,
      createdAt: new Date().toISOString(),
    };

    store.createRun(newRun);
    return reply.status(201).send({ run: newRun });
  });

  // Leaderboard endpoint
  app.get("/api/v1/leaderboard", async () => {
    const leaderboard = store.getLeaderboard();
    return {
      updatedAt: new Date().toISOString(),
      totalAgents: leaderboard.length,
      leaderboard,
    };
  });
}
