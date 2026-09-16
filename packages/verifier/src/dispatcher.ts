import { VerificationCheck } from "@kazi-ai/task-schema";
import { VerificationCheckResult, VerificationContext, VerificationResult, Verifier } from "./types.js";
import { CommandVerifier } from "./command-verifier.js";
import { FilesystemVerifier } from "./fs-verifier.js";
import { HttpVerifier } from "./http-verifier.js";
import { DatabaseVerifier } from "./db-verifier.js";
import { SecurityVerifier } from "./security-verifier.js";
import { LlmJudgeVerifier } from "./llm-judge.js";

export class VerifierDispatcher implements Verifier {
  public readonly name = "KaziAIVerifierDispatcher";

  public async verify(context: VerificationContext): Promise<VerificationResult> {
    const start = Date.now();
    const checkResults: VerificationCheckResult[] = [];
    const checks = context.task.verification.checks;

    let totalWeightedScore = 0;
    let totalWeight = 0;
    let allPassed = true;

    for (const check of checks) {
      const res = await this.dispatchCheck(check, context);
      checkResults.push(res);

      totalWeightedScore += res.score * res.weight;
      totalWeight += res.weight;

      if (!res.passed) {
        allPassed = false;
        if (context.task.verification.stop_on_first_failure) {
          break;
        }
      }
    }

    const score = totalWeight > 0 ? Number((totalWeightedScore / totalWeight).toFixed(4)) : 0.0;
    const durationMs = Date.now() - start;

    return {
      passed: allPassed && score >= (context.task.scoring.minimum_score ?? 0.8),
      score,
      checks: checkResults,
      evidence: checkResults.map((c) => ({
        name: c.name,
        category: "check",
        details: c.evidence,
        passed: c.passed,
        timestamp: new Date().toISOString(),
      })),
      durationMs,
    };
  }

  private async dispatchCheck(
    check: VerificationCheck,
    context: VerificationContext
  ): Promise<VerificationCheckResult> {
    switch (check.type) {
      case "command":
      case "test":
        return CommandVerifier.verifyCheck(check, context);
      case "filesystem":
      case "git":
        return FilesystemVerifier.verifyCheck(check, context);
      case "http":
        return HttpVerifier.verifyCheck(check, context);
      case "database":
        return DatabaseVerifier.verifyCheck(check, context);
      case "security":
        return SecurityVerifier.verifyCheck(check, context);
      case "llm_judge":
        return LlmJudgeVerifier.evaluate(check, context);
      default:
        return CommandVerifier.verifyCheck(check, context);
    }
  }
}
