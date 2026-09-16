import { SeededRNG } from "./random.js";
import { TaskDefinition } from "./task.js";
import { TaskTemplateRegistry, TaskVariantOptions } from "./template.js";

export function generateTaskVariant(baseTask: TaskDefinition, options: TaskVariantOptions): TaskDefinition {
  const rng = new SeededRNG(options.seed);
  const variantSuffix = typeof options.seed === "number" ? options.seed.toString() : String(options.seed);
  const randomizedPort = rng.nextInt(3000, 9000);
  const tokenSecret = `sec_${rng.nextInt(100000, 999999)}`;

  // Deep clone
  const variant: TaskDefinition = JSON.parse(JSON.stringify(baseTask));

  variant.id = `${baseTask.id}-v${variantSuffix}`;
  variant.name = `${baseTask.name} (Seed: ${variantSuffix})`;

  // Inject randomized env variables
  variant.environment.env = {
    ...variant.environment.env,
    KAZI_RUN_SEED: String(options.seed),
    KAZI_PORT: String(randomizedPort),
    KAZI_AUTH_TOKEN: tokenSecret,
  };

  return variant;
}

export function generateFromRegistry(templateId: string, options: TaskVariantOptions): TaskDefinition {
  const registry = TaskTemplateRegistry.getInstance();
  const template = registry.get(templateId);
  if (!template) {
    throw new Error(`Task template '${templateId}' not found in registry`);
  }
  return template.generateVariant(options);
}
