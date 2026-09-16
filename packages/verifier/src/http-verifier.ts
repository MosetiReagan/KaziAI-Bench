import { VerificationCheck } from "@kazi-ai/task-schema";
import { VerificationCheckResult, VerificationContext } from "./types.js";

export class HttpVerifier {
  public static async verifyCheck(
    check: VerificationCheck,
    _context: VerificationContext
  ): Promise<VerificationCheckResult> {
    const start = Date.now();
    const url = check.http_url || "";
    const method = check.http_method || "GET";
    const expectedStatus = check.http_expected_status ?? 200;

    let passed = false;
    let actual = "";
    let evidence = "";

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), (check.timeout_seconds || 15) * 1000);

      const res = await fetch(url, {
        method,
        signal: controller.signal,
      });

      clearTimeout(timer);

      const bodyText = await res.text();
      passed = res.status === expectedStatus;

      actual = `HTTP ${res.status}`;
      evidence = `URL: ${url} [${method}]\nResponse Status: ${res.status}\nBody: ${bodyText.slice(0, 300)}`;

      if (check.expected_output && !bodyText.includes(check.expected_output)) {
        passed = false;
        actual += ` | Missing substring: '${check.expected_output}'`;
      }
    } catch (err) {
      actual = `Connection failed: ${String(err)}`;
      evidence = `Error connecting to ${url}: ${String(err)}`;
      passed = false;
    }

    return {
      checkId: check.id || check.name,
      name: check.name,
      passed,
      score: passed ? 1.0 : 0.0,
      weight: check.weight ?? 1.0,
      expected: `HTTP ${expectedStatus}`,
      actual,
      evidence,
      durationMs: Date.now() - start,
      hidden: check.hidden,
    };
  }
}
