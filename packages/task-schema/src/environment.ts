import { z } from "zod";

export const EnvironmentTypeSchema = z.enum(["docker", "isolated-process"]).default("isolated-process");

export const EnvironmentSetupStepSchema = z.object({
  command: z.string(),
  description: z.string().optional(),
  timeout_seconds: z.number().int().positive().default(60),
});

export const TaskEnvironmentSchema = z.object({
  type: EnvironmentTypeSchema,
  image: z.string().optional().default("kazi-bench/runtime-node:latest"),
  dockerfile: z.string().optional(),
  context_dir: z.string().optional(),
  env: z.record(z.string()).default({}),
  setup: z.array(EnvironmentSetupStepSchema).default([]),
  teardown: z.array(EnvironmentSetupStepSchema).default([]),
  fixture_path: z.string().optional(),
  workdir: z.string().default("/workspace"),
});

export type EnvironmentType = z.infer<typeof EnvironmentTypeSchema>;
export type EnvironmentSetupStep = z.infer<typeof EnvironmentSetupStepSchema>;
export type TaskEnvironment = z.infer<typeof TaskEnvironmentSchema>;
