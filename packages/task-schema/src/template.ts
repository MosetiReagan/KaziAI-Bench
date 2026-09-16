import { SeededRNG } from "./random.js";
import { TaskDefinition } from "./task.js";

export interface TaskVariantOptions {
  seed: number | string;
  variantId?: string;
  parameters?: Record<string, unknown>;
}

export interface TaskTemplate {
  id: string;
  baseTask: TaskDefinition;
  generateVariant(options: TaskVariantOptions): TaskDefinition;
}

export class TaskTemplateRegistry {
  private static instance: TaskTemplateRegistry;
  private templates: Map<string, TaskTemplate> = new Map();

  public static getInstance(): TaskTemplateRegistry {
    if (!TaskTemplateRegistry.instance) {
      TaskTemplateRegistry.instance = new TaskTemplateRegistry();
    }
    return TaskTemplateRegistry.instance;
  }

  public register(template: TaskTemplate): void {
    this.templates.set(template.id, template);
  }

  public get(id: string): TaskTemplate | undefined {
    return this.templates.get(id);
  }

  public has(id: string): boolean {
    return this.templates.has(id);
  }

  public list(): string[] {
    return Array.from(this.templates.keys());
  }
}
