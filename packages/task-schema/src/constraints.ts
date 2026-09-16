import { z } from "zod";
import {
  DEFAULT_MAX_STEPS,
  DEFAULT_MAX_TOKENS,
  DEFAULT_MAX_TOOL_CALLS,
  DEFAULT_TIMEOUT_SECONDS,
} from "@kazi-ai/core";

export const NetworkPolicySchema = z.enum(["disabled", "localhost_only", "allow_all"]).default("disabled");

export const ResourceLimitsSchema = z.object({
  cpu_limit: z.number().positive().default(2.0),
  memory_limit_mb: z.number().int().positive().default(2048),
  process_limit: z.number().int().positive().default(64),
  disk_limit_mb: z.number().int().positive().default(4096),
});

export const TaskConstraintsSchema = z.object({
  network: NetworkPolicySchema,
  max_duration_seconds: z.number().int().positive().default(DEFAULT_TIMEOUT_SECONDS),
  max_steps: z.number().int().positive().default(DEFAULT_MAX_STEPS),
  max_tokens: z.number().int().positive().default(DEFAULT_MAX_TOKENS),
  max_tool_calls: z.number().int().positive().default(DEFAULT_MAX_TOOL_CALLS),
  max_cost_usd: z.number().positive().optional(),
  resources: ResourceLimitsSchema.default({}),
  forbidden_commands: z.array(z.string()).default([
    "rm -rf /",
    ":(){ :|:& };:",
    "mkfs",
    "dd if=/dev/zero",
    "sudo",
  ]),
});

export type NetworkPolicy = z.infer<typeof NetworkPolicySchema>;
export type ResourceLimits = z.infer<typeof ResourceLimitsSchema>;
export type TaskConstraints = z.infer<typeof TaskConstraintsSchema>;
