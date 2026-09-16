import { ZodError } from "zod";
import { TaskDefinition, TaskDefinitionSchema } from "./task.js";

export interface ValidationIssue {
  path: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  task?: TaskDefinition;
}

export function validateTaskDefinition(data: unknown): ValidationResult {
  try {
    const task = TaskDefinitionSchema.parse(data);
    return {
      valid: true,
      errors: [],
      task,
    };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        valid: false,
        errors: err.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
          code: e.code,
        })),
      };
    }
    return {
      valid: false,
      errors: [{ path: "", message: String(err), code: "custom" }],
    };
  }
}
