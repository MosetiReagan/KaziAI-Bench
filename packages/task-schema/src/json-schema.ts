import { zodToJsonSchema } from "zod-to-json-schema";
import { TaskDefinitionSchema, TaskMetadataSchema } from "./task.js";
import { VerificationSchema } from "./verification.js";
import { TaskConstraintsSchema } from "./constraints.js";
import { TaskEnvironmentSchema } from "./environment.js";
import { ScoringConfigSchema } from "./scoring.js";

export function getTaskJsonSchema(): Record<string, unknown> {
  return zodToJsonSchema(TaskDefinitionSchema, {
    name: "KaziAITaskDefinition",
    target: "jsonSchema7",
  }) as Record<string, unknown>;
}

export function getMetadataJsonSchema(): Record<string, unknown> {
  return zodToJsonSchema(TaskMetadataSchema, {
    name: "KaziAITaskMetadata",
    target: "jsonSchema7",
  }) as Record<string, unknown>;
}

export function getVerificationJsonSchema(): Record<string, unknown> {
  return zodToJsonSchema(VerificationSchema, {
    name: "KaziAIVerificationConfig",
    target: "jsonSchema7",
  }) as Record<string, unknown>;
}

export function getConstraintsJsonSchema(): Record<string, unknown> {
  return zodToJsonSchema(TaskConstraintsSchema, {
    name: "KaziAITaskConstraints",
    target: "jsonSchema7",
  }) as Record<string, unknown>;
}

export function getEnvironmentJsonSchema(): Record<string, unknown> {
  return zodToJsonSchema(TaskEnvironmentSchema, {
    name: "KaziAITaskEnvironment",
    target: "jsonSchema7",
  }) as Record<string, unknown>;
}

export function getScoringJsonSchema(): Record<string, unknown> {
  return zodToJsonSchema(ScoringConfigSchema, {
    name: "KaziAIScoringConfig",
    target: "jsonSchema7",
  }) as Record<string, unknown>;
}
