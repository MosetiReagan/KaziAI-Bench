import fs from "fs";
import path from "path";
import yaml from "yaml";
import { TaskDefinition } from "./task.js";
import { validateTaskDefinition } from "./validate.js";
import { KaziError } from "@kazi-ai/core";

export class TaskLoadError extends KaziError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, "TASK_FAILURE", { isRecoverable: false, metadata });
    this.name = "TaskLoadError";
  }
}

export function parseTaskString(content: string, sourceName = "raw_string"): TaskDefinition {
  let parsed: unknown;
  try {
    if (content.trim().startsWith("{")) {
      parsed = JSON.parse(content);
    } else {
      parsed = yaml.parse(content);
    }
  } catch (err) {
    throw new TaskLoadError(`Failed to parse task definition in ${sourceName}: ${String(err)}`, {
      source: sourceName,
      error: String(err),
    });
  }

  const result = validateTaskDefinition(parsed);
  if (!result.valid || !result.task) {
    const errorDetails = result.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
    throw new TaskLoadError(`Validation failed for task ${sourceName}: ${errorDetails}`, {
      source: sourceName,
      errors: result.errors,
    });
  }

  return result.task;
}

export function loadTaskFromFile(filePath: string): TaskDefinition {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new TaskLoadError(`Task file not found at: ${resolved}`, { path: resolved });
  }

  const content = fs.readFileSync(resolved, "utf-8");
  return parseTaskString(content, resolved);
}

export function loadTasksFromDirectory(dirPath: string): TaskDefinition[] {
  const resolved = path.resolve(dirPath);
  if (!fs.existsSync(resolved)) {
    return [];
  }

  const tasks: TaskDefinition[] = [];
  const entries = fs.readdirSync(resolved, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(resolved, entry.name);
    if (entry.isDirectory()) {
      tasks.push(...loadTasksFromDirectory(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith(".yaml") || entry.name.endsWith(".yml") || entry.name.endsWith(".json"))) {
      try {
        const task = loadTaskFromFile(fullPath);
        tasks.push(task);
      } catch {
        // Skip files that aren't valid tasks if scanning mixed folders
      }
    }
  }

  return tasks;
}
