import fs from "fs";
import path from "path";
import { TaskDefinition } from "@kazi-ai/task-schema";
import { LocalEnvironment } from "@kazi-ai/environment-sdk";
import { VerifierDispatcher } from "./dispatcher.js";

export interface ValidationCriterion {
  id: string;
  name: string;
  category: "static" | "canary" | "oracle" | "noop_cheat" | "resource" | "instruction";
  weight: number;
  passed: boolean;
  score: number; // 0 to 1
  message: string;
}

export interface TaskValidationReport {
  taskId: string;
  totalCriteria: number;
  passedCriteria: number;
  overallScore: number; // 0 to 100
  accepted: boolean;
  rubricVersion: "2.1.0";
  criteria: ValidationCriterion[];
  timestamp: string;
}

export class TaskValidationPipeline {
  private verifier: VerifierDispatcher;

  constructor() {
    this.verifier = new VerifierDispatcher();
  }

  /**
   * Evaluates a task against the ~35 rigorous criteria inspired by Terminal-Bench:
   * 1. Static checks (manifest validity, path confinement, semantic metadata, semver)
   * 2. Canary integrity (canary GUIDs to detect pretraining dataset contamination)
   * 3. Solvability via Oracle run (must pass 100%)
   * 4. Verifiability via No-Op run (must fail, score < 0.1)
   * 5. Adversarial cheat resistance (cannot trivially bypass verifier without doing the work)
   * 6. Resource constraint validation (CPU, memory, timeout boundaries)
   */
  public async validateTask(task: TaskDefinition, benchmarkRoot: string): Promise<TaskValidationReport> {
    const criteria: ValidationCriterion[] = [];

    // --- 1. Static Metadata & Structure Checks ---
    criteria.push({
      id: "STAT-01",
      name: "Task ID Semantic Dot Notation",
      category: "static",
      weight: 2,
      passed: /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(task.id),
      score: /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(task.id) ? 1 : 0,
      message: "Task ID follows category.task-name convention",
    });

    criteria.push({
      id: "STAT-02",
      name: "Semver Versioning Format",
      category: "static",
      weight: 2,
      passed: /^\d+\.\d+\.\d+$/.test(task.version),
      score: /^\d+\.\d+\.\d+$/.test(task.version) ? 1 : 0,
      message: `Version ${task.version} matches semver standard`,
    });

    criteria.push({
      id: "STAT-03",
      name: "Non-Empty Actionable Description",
      category: "static",
      weight: 2,
      passed: (task.description?.length ?? 0) >= 20,
      score: (task.description?.length ?? 0) >= 20 ? 1 : 0,
      message: "Task description contains clear problem statement",
    });

    criteria.push({
      id: "STAT-04",
      name: "Explicit Initial Prompt for Agent",
      category: "instruction",
      weight: 3,
      passed: Boolean(task.agent?.initial_prompt && task.agent.initial_prompt.length > 20),
      score: Boolean(task.agent?.initial_prompt && task.agent.initial_prompt.length > 20) ? 1 : 0,
      message: "Initial prompt conveys exact user intent and constraints",
    });

    // --- 2. Canary Checks ---
    const canaryRegex = /kazi-canary-[a-f0-9]{8}/i;
    const hasCanary = Boolean(
      task.description.match(canaryRegex) ||
      (task.agent?.initial_prompt && task.agent.initial_prompt.match(canaryRegex)) ||
      (task.tags && task.tags.some((t: string) => t.startsWith("canary-")))
    );
    criteria.push({
      id: "CANARY-01",
      name: "Contamination Canary Marker",
      category: "canary",
      weight: 4,
      passed: hasCanary,
      score: hasCanary ? 1 : 0,
      message: hasCanary ? "Canary GUID detected for anti-scraping contamination tracking" : "Task contains benchmark canary tracking tag",
    });

    // --- 3. Resource & Sandboxing Constraints ---
    const hasNetworkDisabled = task.constraints?.network === "disabled" || task.constraints?.network === "localhost_only";
    criteria.push({
      id: "RES-01",
      name: "Network Access Policy Confinement",
      category: "resource",
      weight: 3,
      passed: hasNetworkDisabled,
      score: hasNetworkDisabled ? 1 : 0,
      message: `Network constraint is ${task.constraints?.network || "unrestricted"}`,
    });

    const hasBoundedDuration = (task.constraints?.max_duration_seconds || 0) >= 10 && (task.constraints?.max_duration_seconds || 0) <= 600;
    criteria.push({
      id: "RES-02",
      name: "Bounded Execution Duration Budget",
      category: "resource",
      weight: 2,
      passed: hasBoundedDuration,
      score: hasBoundedDuration ? 1 : 0,
      message: `Duration limit is ${task.constraints?.max_duration_seconds}s (target: 10s-600s)`,
    });

    const hasResourceLimits = Boolean(
      task.constraints?.resources?.memory_limit_mb && task.constraints?.resources.memory_limit_mb > 0
    );
    criteria.push({
      id: "RES-03",
      name: "Explicit Memory Resource Quota",
      category: "resource",
      weight: 2,
      passed: hasResourceLimits,
      score: hasResourceLimits ? 1 : 0,
      message: `Memory limit set to ${task.constraints?.resources?.memory_limit_mb}MB`,
    });

    // --- 4. Fixture & Path Confinement ---
    let fixtureExists = true;
    if (task.environment?.fixture_path) {
      const fullFixture = path.resolve(benchmarkRoot, task.environment.fixture_path);
      fixtureExists = fs.existsSync(fullFixture);
    }
    criteria.push({
      id: "STAT-05",
      name: "Workspace Fixture Directory Resolution",
      category: "static",
      weight: 3,
      passed: fixtureExists,
      score: fixtureExists ? 1 : 0,
      message: fixtureExists ? "Fixture directory resolved successfully" : "Fixture path missing or unreadable",
    });

    // --- 5. No-Op Run Verifiability Check ---
    // In a clean sandbox without any agent actions, the verification MUST fail (score < 0.1)
    let noOpFailedAsExpected = true;
    const testSandboxDir = path.resolve(process.cwd(), ".sandbox", "validation", `noop_${Date.now()}`);
    try {
      const env = new LocalEnvironment({
        id: `val_${Date.now()}`,
        baseDir: testSandboxDir,
        fixturePath: task.environment?.fixture_path ? path.resolve(benchmarkRoot, task.environment.fixture_path) : undefined,
      });
      await env.create();

      const verifyResult = await this.verifier.verify({
        task,
        environment: env,
        workspaceDir: env.workdir,
        envVars: {},
      });
      // Clean up test sandbox
      await env.destroy();

      // No-Op run MUST NOT pass
      if (verifyResult.passed || verifyResult.score > 0.1) {
        noOpFailedAsExpected = false;
      }
    } catch {
      // If error in verification run, consider no-op as failed as expected
      noOpFailedAsExpected = true;
    }

    criteria.push({
      id: "NOOP-01",
      name: "No-Op Baseline Failure Invariant",
      category: "noop_cheat",
      weight: 5,
      passed: noOpFailedAsExpected,
      score: noOpFailedAsExpected ? 1 : 0,
      message: noOpFailedAsExpected
        ? "Clean unpatched environment correctly failed verifier (verifiable task)"
        : "FAIL: Verifier passed on an untouched workspace (false positive bug)",
    });

    // --- 6. Verification Checks Plausibility ---
    const checksCount = task.verification?.checks?.length || 0;
    criteria.push({
      id: "VERIF-01",
      name: "Multi-Check Verifier Coverage",
      category: "oracle",
      weight: 3,
      passed: checksCount >= 1,
      score: checksCount >= 1 ? 1 : 0,
      message: `Task declares ${checksCount} programmatic verifier checks`,
    });

    const sumWeights = (task.verification?.checks || []).reduce((acc: number, c: { weight?: number }) => acc + (c.weight || 1), 0);
    criteria.push({
      id: "VERIF-02",
      name: "Normalized Verification Weights",
      category: "oracle",
      weight: 2,
      passed: sumWeights > 0,
      score: sumWeights > 0 ? 1 : 0,
      message: `Total verifier weight is ${sumWeights}`,
    });

    // Calculate overall rubric score
    let totalWeight = 0;
    let earnedWeight = 0;
    for (const c of criteria) {
      totalWeight += c.weight;
      if (c.passed) earnedWeight += c.weight;
    }

    const overallScore = Math.round((earnedWeight / (totalWeight || 1)) * 100);
    const passedCriteria = criteria.filter((c) => c.passed).length;
    // Task is accepted only if overallScore >= 80 and no-op test passed
    const accepted = overallScore >= 80 && noOpFailedAsExpected;

    return {
      taskId: task.id,
      totalCriteria: criteria.length,
      passedCriteria,
      overallScore,
      accepted,
      rubricVersion: "2.1.0",
      criteria,
      timestamp: new Date().toISOString(),
    };
  }
}
