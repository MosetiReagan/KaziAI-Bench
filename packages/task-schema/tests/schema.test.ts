import { describe, it, expect } from "vitest";
import {
  parseTaskString,
  validateTaskDefinition,
  generateTaskVariant,
  getTaskJsonSchema,
  SeededRNG,
} from "../src/index.js";

const VALID_TASK_YAML = `
id: coding.fix-auth
version: 1.0.0
name: Fix Authentication Middleware
description: Repair authentication middleware so protected API routes correctly reject unauthorized requests.
category: coding
difficulty: medium
environment:
  type: isolated-process
verification:
  type: deterministic
  checks:
    - name: Run test suite
      type: command
      command: npm test
scoring:
  minimum_score: 0.9
`;

describe("@kazi-ai/task-schema", () => {
  it("should parse and validate a valid YAML task", () => {
    const task = parseTaskString(VALID_TASK_YAML, "test.yaml");
    expect(task.id).toBe("coding.fix-auth");
    expect(task.version).toBe("1.0.0");
    expect(task.category).toBe("coding");
    expect(task.verification.checks.length).toBe(1);
    expect(task.constraints.network).toBe("disabled");
  });

  it("should reject tasks with invalid IDs or missing required fields", () => {
    const invalidYaml = `
id: INVALID_ID_FORMAT
version: not-semver
name: X
category: invalid-category
`;
    const result = validateTaskDefinition(invalidYaml);
    expect(result.valid).toBe(false);
  });

  it("should generate deterministic variants using seed", () => {
    const task = parseTaskString(VALID_TASK_YAML);
    const v1 = generateTaskVariant(task, { seed: 42 });
    const v2 = generateTaskVariant(task, { seed: 42 });
    const v3 = generateTaskVariant(task, { seed: 999 });

    expect(v1.id).toBe("coding.fix-auth-v42");
    expect(v1.environment.env["KAZI_PORT"]).toBe(v2.environment.env["KAZI_PORT"]);
    expect(v1.environment.env["KAZI_AUTH_TOKEN"]).toBe(v2.environment.env["KAZI_AUTH_TOKEN"]);

    // Different seed produces different random values
    expect(v1.environment.env["KAZI_RUN_SEED"]).not.toBe(v3.environment.env["KAZI_RUN_SEED"]);
  });

  it("should export valid JSON schema", () => {
    const schema = getTaskJsonSchema();
    expect(schema).toBeDefined();
    expect(typeof schema).toBe("object");
  });

  it("should produce reproducible PRNG sequence", () => {
    const rng1 = new SeededRNG("reproducible-seed");
    const rng2 = new SeededRNG("reproducible-seed");

    const seq1 = [rng1.next(), rng1.nextInt(1, 100), rng1.next()];
    const seq2 = [rng2.next(), rng2.nextInt(1, 100), rng2.next()];

    expect(seq1).toEqual(seq2);
  });
});
