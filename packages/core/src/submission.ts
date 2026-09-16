import { z } from "zod";

export const MINIMUM_TRIALS_PER_TASK = 5;

export const SubmissionMetadataSchema = z.object({
  agent_name: z.string().min(2).max(100),
  agent_version: z.string().default("1.0.0"),
  organization: z.string().min(2).max(100),
  model_name: z.string().min(2).max(100),
  model_provider: z.string().min(2).max(50),
  benchmark_suite: z.string().default("kazi-bench-core-v2.0.0"),
  config: z.object({
    temperature: z.number().min(0).max(2).default(0.0),
    max_steps: z.number().int().min(1).max(100).default(30),
    timeout_seconds: z.number().int().min(10).max(600).default(300),
    system_prompt_hash: z.string().optional(),
    tools_enabled: z.array(z.string()).default(["terminal", "filesystem"]),
  }),
  contact_email: z.string().email(),
  repository_url: z.string().url().optional(),
  paper_url: z.string().url().optional(),
  public_logs: z.boolean().default(true),
});

export const TaskTrialSchema = z.object({
  trial_number: z.number().int().min(1),
  seed: z.union([z.string(), z.number()]),
  passed: z.boolean(),
  score: z.number().min(0).max(1),
  duration_ms: z.number().int().min(0),
  tokens: z.object({
    prompt: z.number().int().min(0),
    completion: z.number().int().min(0),
    total: z.number().int().min(0),
  }),
  cost_usd: z.number().min(0),
  trajectory: z.array(z.record(z.unknown())), // Required public trajectory log
  verification_evidence: z.array(z.record(z.unknown())).default([]),
});

export const TaskSubmissionResultSchema = z.object({
  task_id: z.string(),
  trials: z.array(TaskTrialSchema).min(MINIMUM_TRIALS_PER_TASK, `Each benchmark task requires a minimum of ${MINIMUM_TRIALS_PER_TASK} distinct trials`),
  mean_score: z.number().min(0).max(1),
  pass_rate: z.number().min(0).max(100),
  std_dev: z.number().min(0),
});

export const BenchmarkSubmissionPackageSchema = z.object({
  submission_id: z.string(),
  metadata: SubmissionMetadataSchema,
  task_results: z.array(TaskSubmissionResultSchema).min(1),
  aggregate: z.object({
    total_tasks: z.number().int(),
    total_trials: z.number().int(),
    overall_pass_rate: z.number().min(0).max(100),
    overall_composite_score: z.number().min(0).max(100),
    mean_duration_ms: z.number(),
    mean_cost_usd: z.number(),
  }),
  submitted_at: z.string(),
});

export type SubmissionMetadata = z.infer<typeof SubmissionMetadataSchema>;
export type TaskTrial = z.infer<typeof TaskTrialSchema>;
export type TaskSubmissionResult = z.infer<typeof TaskSubmissionResultSchema>;
export type BenchmarkSubmissionPackage = z.infer<typeof BenchmarkSubmissionPackageSchema>;

export function validateSubmissionPackage(raw: unknown): { valid: boolean; errors: string[]; data?: BenchmarkSubmissionPackage } {
  const parsed = BenchmarkSubmissionPackageSchema.safeParse(raw);
  if (parsed.success) {
    return { valid: true, errors: [], data: parsed.data };
  }
  return {
    valid: false,
    errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}
