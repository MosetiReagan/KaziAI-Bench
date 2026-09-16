import { VerificationCheck } from "@kazi-ai/task-schema";
import { Evidence, VerificationCheckResult, VerificationContext } from "./types.js";

export class CommandVerifier {
  public static async verifyCheck(
    check: VerificationCheck,
    context: VerificationContext
  ): Promise<VerificationCheckResult> {
    const start = Date.now();
    const command = check.command || "";

    const res = await context.environment.execute({
      cmd: command,
      timeoutMs: (check.timeout_seconds || 60) * 1000,
      cwd: context.workspaceDir,
      env: context.envVars,
    });

    const expectedExitCode = check.expected_exit_code ?? 0;
    let passed = res.exitCode === expectedExitCode && !res.timedOut;

    let actual = `Exit code: ${res.exitCode}`;
    if (res.timedOut) actual += " (TIMED OUT)";

    if (check.expected_output && !res.stdout.includes(check.expected_output)) {
      passed = false;
      actual += ` | Output missing substring: '${check.expected_output}'`;
    }

    if (check.expected_regex && !new RegExp(check.expected_regex).test(res.stdout)) {
      passed = false;
      actual += ` | Output failed regex: /${check.expected_regex}/`;
    }

    const durationMs = Date.now() - start;
    const outputSummary = res.stdout.length > 500 ? res.stdout.slice(0, 500) + "...[truncated]" : res.stdout;

    return {
      checkId: check.id || check.name,
      name: check.name,
      passed,
      score: passed ? 1.0 : 0.0,
      weight: check.weight ?? 1.0,
      expected: `Exit code: ${expectedExitCode}${check.expected_output ? ` & Output contains: ${check.expected_output}` : ""}`,
      actual,
      evidence: `Command: ${command}\nStdout: ${outputSummary}\nStderr: ${res.stderr}`,
      durationMs,
      hidden: check.hidden,
    };
  }
}
