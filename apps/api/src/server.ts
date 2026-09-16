import fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { MemoryStore } from "./store.js";
import { registerTaskRoutes } from "./routes/tasks.js";
import { registerRunRoutes } from "./routes/runs.js";
import { BENCHMARK_NAME, BENCHMARK_VERSION } from "@kazi-ai/core";

export function createServer(store: MemoryStore = new MemoryStore()): FastifyInstance {
  const app = fastify({ logger: false });

  app.register(cors, { origin: true });
  app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

  registerTaskRoutes(app, store);
  registerRunRoutes(app, store);

  // Basic Health Check
  app.get("/health", async () => {
    return {
      status: "ok",
      service: "kazi-api",
      benchmark: BENCHMARK_NAME,
      version: BENCHMARK_VERSION,
      timestamp: new Date().toISOString(),
    };
  });

  return app;
}
