import fs from "fs";
import path from "path";
import { VerificationCheck } from "@kazi-ai/task-schema";
import { VerificationCheckResult, VerificationContext } from "./types.js";

export class FilesystemVerifier {
  public static async verifyCheck(
    check: VerificationCheck,
    context: VerificationContext
  ): Promise<VerificationCheckResult> {
    const start = Date.now();
    const relPath = check.path || "";
    const targetPath = path.resolve(context.workspaceDir, relPath);

    let passed = true;
    let actual = "";
    let evidence = "";

    if (check.file_exists !== undefined) {
      const exists = fs.existsSync(targetPath);
      if (exists !== check.file_exists) {
        passed = false;
        actual = `File exists: ${exists}, expected: ${check.file_exists}`;
      } else {
        actual = `File exists as expected (${exists})`;
      }
      evidence = `Path: ${relPath} | Exists: ${exists}`;
    }

    if (passed && check.file_content_regex && fs.existsSync(targetPath)) {
      const content = fs.readFileSync(targetPath, "utf-8");
      const regex = new RegExp(check.file_content_regex);
      if (!regex.test(content)) {
        passed = false;
        actual = `Content did not match pattern /${check.file_content_regex}/`;
      } else {
        actual = `Content matched pattern /${check.file_content_regex}/`;
      }
      evidence += `\nMatched regex: ${check.file_content_regex}`;
    }

    return {
      checkId: check.id || check.name,
      name: check.name,
      passed,
      score: passed ? 1.0 : 0.0,
      weight: check.weight ?? 1.0,
      expected: `Path: ${relPath}, exists: ${check.file_exists ?? true}`,
      actual,
      evidence,
      durationMs: Date.now() - start,
      hidden: check.hidden,
    };
  }
}
