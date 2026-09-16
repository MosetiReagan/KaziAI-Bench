import { FastifyInstance } from "fastify";
import { MemoryStore } from "../store.js";
import { requireAuth } from "../auth.js";
import { validateSubmissionPackage, BenchmarkSubmissionPackage } from "@kazi-ai/core";

export function registerSubmissionRoutes(app: FastifyInstance, store: MemoryStore): void {
  // Submit official benchmark run package
  app.post("/api/v1/submissions", { preHandler: [requireAuth(store, ["admin", "user"])] }, async (request, reply) => {
    const validation = validateSubmissionPackage(request.body);

    if (!validation.valid || !validation.data) {
      return reply.status(400).send({
        error: "Invalid Benchmark Submission Package",
        details: validation.errors,
      });
    }

    const sub: BenchmarkSubmissionPackage = validation.data;

    // Ingest each verified task trial into the store and update leaderboard
    for (const taskResult of sub.task_results) {
      for (const trial of taskResult.trials) {
        store.createRun({
          id: `sub_${sub.submission_id}_t${trial.trial_number}`,
          taskId: taskResult.task_id,
          agentId: sub.metadata.agent_name,
          modelId: sub.metadata.model_name,
          status: "COMPLETED",
          success: trial.passed,
          score: trial.score,
          totalSteps: trial.trajectory.length,
          totalDurationMs: trial.duration_ms,
          totalCostUsd: trial.cost_usd,
          totalTokens: trial.tokens.total,
          seed: String(trial.seed),
          createdAt: sub.submitted_at,
          trajectory: { events: trial.trajectory },
          metrics: {
            meanScore: taskResult.mean_score,
            passRate: taskResult.pass_rate,
            stdDev: taskResult.std_dev,
          },
        });
      }
    }

    return reply.status(201).send({
      message: "Submission verified and accepted into official public leaderboard",
      submissionId: sub.submission_id,
      agent: sub.metadata.agent_name,
      model: sub.metadata.model_name,
      overallPassRate: sub.aggregate.overall_pass_rate,
      overallCompositeScore: sub.aggregate.overall_composite_score,
      totalTrials: sub.aggregate.total_trials,
    });
  });
}
