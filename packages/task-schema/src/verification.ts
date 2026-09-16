import { z } from "zod";

export const CheckTypeSchema = z.enum([
  "command",
  "test",
  "http",
  "filesystem",
  "database",
  "git",
  "regex",
  "security",
  "llm_judge",
  "custom",
]);

export const VerificationCheckSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: CheckTypeSchema,
  command: z.string().optional(),
  expected_exit_code: z.number().int().default(0),
  expected_output: z.string().optional(),
  expected_regex: z.string().optional(),
  path: z.string().optional(),
  file_exists: z.boolean().optional(),
  file_content_regex: z.string().optional(),
  http_url: z.string().optional(),
  http_method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("GET"),
  http_expected_status: z.number().int().default(200),
  database_query: z.string().optional(),
  database_expected_count: z.number().int().optional(),
  weight: z.number().min(0).max(1).default(1.0),
  timeout_seconds: z.number().int().positive().default(60),
  hidden: z.boolean().default(false), // hidden tests / verifier checks for anti-gaming
});

export const VerificationSchema = z.object({
  type: z.enum(["deterministic", "hybrid", "llm_judge"]).default("deterministic"),
  checks: z.array(VerificationCheckSchema).min(1),
  stop_on_first_failure: z.boolean().default(false),
  judge_prompt: z.string().optional(),
  judge_model: z.string().optional(),
});

export type CheckType = z.infer<typeof CheckTypeSchema>;
export type VerificationCheck = z.infer<typeof VerificationCheckSchema>;
export type VerificationConfig = z.infer<typeof VerificationSchema>;
