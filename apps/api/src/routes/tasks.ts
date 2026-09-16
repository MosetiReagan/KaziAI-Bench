import { FastifyInstance } from "fastify";
import { MemoryStore } from "../store.js";
import { loadTasksFromDirectory } from "@kazi-ai/task-schema";
import path from "path";

export function registerTaskRoutes(app: FastifyInstance, store: MemoryStore): void {
  // Sync tasks on startup
  try {
    const benchmarksDir = path.resolve(process.cwd(), "benchmarks");
    const loaded = loadTasksFromDirectory(benchmarksDir);
    for (const t of loaded) {
      store.upsertTask({
        id: t.id,
        name: t.name,
        category: t.category,
        difficulty: t.difficulty,
        version: t.version,
        description: t.description,
        timeoutMs: t.constraints?.max_duration_seconds ? t.constraints.max_duration_seconds * 1000 : 60000,
        createdAt: new Date().toISOString(),
      });
    }
  } catch {
    // best-effort
  }

  app.get("/api/v1/tasks", async (request) => {
    const query = request.query as { category?: string; difficulty?: string };
    let tasks = store.listTasks();
    if (query.category) tasks = tasks.filter((t) => t.category === query.category);
    if (query.difficulty) tasks = tasks.filter((t) => t.difficulty === query.difficulty);
    return {
      total: tasks.length,
      tasks,
    };
  });

  app.get("/api/v1/tasks/:id", async (request, reply) => {
    const params = request.params as { id: string };
    const task = store.getTask(params.id);
    if (!task) {
      return reply.status(404).send({ error: `Task '${params.id}' not found` });
    }
    return { task };
  });
}
