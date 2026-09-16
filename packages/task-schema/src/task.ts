import { z } from "zod";
import { CATEGORIES, DIFFICULTIES } from "@kazi-ai/core";
import { TaskConstraintsSchema } from "./constraints.js";
import { TaskEnvironmentSchema } from "./environment.js";
import { VerificationSchema } from "./verification.js";
import { ScoringConfigSchema } from "./scoring.js";

export const TaskCategorySchema = z.enum(CATEGORIES);
export const TaskDifficultySchema = z.enum(DIFFICULTIES);

export const TaskAgentConfigSchema = z.object({
  tools: z.array(z.string()).default(["terminal", "filesystem"]),
  system_prompt_append: z.string().optional(),
  initial_prompt: z.string().optional(),
});

export const TaskMetadataSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/, "Task ID must be dot-separated names (e.g. coding.fix-auth)"),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Task version must follow semver (e.g. 1.0.0)"),
  name: z.string().min(3).max(120),
  description: z.string().min(10),
  category: TaskCategorySchema,
  difficulty: TaskDifficultySchema,
  author: z.string().default("KaziAI Team"),
  tags: z.array(z.string()).default([]),
  public: z.boolean().default(true),
  created_at: z.string().optional(),
});

export const TaskDefinitionSchema = TaskMetadataSchema.extend({
  agent: TaskAgentConfigSchema.default({}),
  constraints: TaskConstraintsSchema.default({ network: "disabled" }),
  environment: TaskEnvironmentSchema.default({ type: "isolated-process" }),
  setup: z.array(z.object({
    command: z.string(),
    description: z.string().optional(),
  })).default([]),
  verification: VerificationSchema,
  scoring: ScoringConfigSchema.default({}),
});

export type TaskMetadata = z.infer<typeof TaskMetadataSchema>;
export type TaskCategory = z.infer<typeof TaskCategorySchema>;
export type TaskDifficulty = z.infer<typeof TaskDifficultySchema>;
export type TaskAgentConfig = z.infer<typeof TaskAgentConfigSchema>;
export type TaskDefinition = z.infer<typeof TaskDefinitionSchema>;
