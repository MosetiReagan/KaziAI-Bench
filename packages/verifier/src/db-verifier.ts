import path from "path";
import { VerificationCheck } from "@kazi-ai/task-schema";
import { VerificationCheckResult, VerificationContext } from "./types.js";

export class DatabaseVerifier {
  public static async verifyCheck(
    check: VerificationCheck,
    context: VerificationContext
  ): Promise<VerificationCheckResult> {
    const start = Date.now();
    const query = check.database_query || "";
    const dbPath = check.path ? path.resolve(context.workspaceDir, check.path) : "test.db";

    // Run query using sqlite3 CLI in the workspace
    const cmd = `sqlite3 "${dbPath}" "${query}"`;
    const res = await context.environment.execute({
      cmd,
      cwd: context.workspaceDir,
      env: context.envVars,
    });

    let passed = res.exitCode === 0;
    let actual = res.stdout.trim();

    if (check.expected_output && !actual.includes(check.expected_output)) {
      passed = false;
      actual = `Query output was '${actual}', missing '${check.expected_output}'`;
    }

    if (check.database_expected_count !== undefined) {
      const lineCount = actual.length === 0 ? 0 : actual.split("\n").length;
      if (lineCount !== check.database_expected_count) {
        passed = false;
        actual = `Row count was ${lineCount}, expected ${check.database_expected_count}`;
      }
    }

    return {
      checkId: check.id || check.name,
      name: check.name,
      passed,
      score: passed ? 1.0 : 0.0,
      weight: check.weight ?? 1.0,
      expected: `Query succeeded with expected rows`,
      actual: actual.slice(0, 200),
      evidence: `Query: ${query}\nOutput: ${actual}\nStderr: ${res.stderr}`,
      durationMs: Date.now() - start,
      hidden: check.hidden,
    };
  }
}
