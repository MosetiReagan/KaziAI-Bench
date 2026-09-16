import { VerificationCheck } from "@kazi-ai/task-schema";
import { VerificationCheckResult, VerificationContext } from "./types.js";

export class SecurityVerifier {
  public static async verifyCheck(
    check: VerificationCheck,
    context: VerificationContext
  ): Promise<VerificationCheckResult> {
    const start = Date.now();
    const command = check.command || "";

    // Execute security exploit check in environment
    const res = await context.environment.execute({
      cmd: command,
      cwd: context.workspaceDir,
      env: context.envVars,
    });

    // For security tasks, expected exit code or output indicates remediation
    const expectedExitCode = check.expected_exit_code ?? 0;
    let passed = res.exitCode === expectedExitCode;

    let actual = `Exit code: ${res.exitCode}`;

    if (check.expected_output && !res.stdout.includes(check.expected_output)) {
      passed = false;
      actual += ` | Exploit output missing expected remediation indicator: '${check.expected_output}'`;
    }

    // Exploit signatures that should NOT be present if remediated
    const exploitSignatures = ["root:x:0:0:", "uid=0(root)", "VULNERABILITY_EXPLOITED"];
    for (const sig of exploitSignatures) {
      if (res.stdout.includes(sig)) {
        passed = false;
        actual += ` | Vulnerability still active! Found exploit signature: '${sig}'`;
      }
    }

    return {
      checkId: check.id || check.name,
      name: check.name,
      passed,
      score: passed ? 1.0 : 0.0,
      weight: check.weight ?? 1.0,
      expected: `Vulnerability remediated (no leak of sensitive state)`,
      actual,
      evidence: `Security Test: ${command}\nOutput: ${res.stdout.slice(0, 300)}`,
      durationMs: Date.now() - start,
      hidden: check.hidden,
    };
  }
}
