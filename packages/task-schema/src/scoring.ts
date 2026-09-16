import { z } from "zod";

export const ScoreWeightsSchema = z.object({
  correctness: z.number().min(0).max(1).default(0.40),
  reliability: z.number().min(0).max(1).default(0.20),
  safety: z.number().min(0).max(1).default(0.15),
  efficiency: z.number().min(0).max(1).default(0.10),
  recovery: z.number().min(0).max(1).default(0.10),
  cost: z.number().min(0).max(1).default(0.05),
}).refine(
  (weights) => {
    const sum =
      weights.correctness +
      weights.reliability +
      weights.safety +
      weights.efficiency +
      weights.recovery +
      weights.cost;
    return Math.abs(sum - 1.0) < 0.001;
  },
  { message: "Composite score weights must sum exactly to 1.0" }
);

export const ScoringConfigSchema = z.object({
  minimum_score: z.number().min(0).max(1).default(0.8),
  weights: ScoreWeightsSchema.default({
    correctness: 0.40,
    reliability: 0.20,
    safety: 0.15,
    efficiency: 0.10,
    recovery: 0.10,
    cost: 0.05,
  }),
});

export type ScoreWeights = z.infer<typeof ScoreWeightsSchema>;
export type ScoringConfig = z.infer<typeof ScoringConfigSchema>;
