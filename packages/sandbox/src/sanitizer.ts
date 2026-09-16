import path from "path";
import { SecurityViolationError } from "@kazi-ai/core";
import { SandboxSecurityPolicy } from "./policy.js";

export class SandboxSanitizer {
  private policy: SandboxSecurityPolicy;

  constructor(policy: SandboxSecurityPolicy) {
    this.policy = policy;
  }

  public validateCommand(command: string): void {
    const trimmed = command.trim();

    // Check forbidden exact strings or subcommands
    for (const forbidden of this.policy.forbiddenCommands) {
      if (trimmed === forbidden || trimmed.includes(forbidden)) {
        // If it's a network tool (curl/wget), only forbid if network policy is disabled
        if ((forbidden === "curl" || forbidden === "wget") && this.policy.networkPolicy !== "disabled") {
          continue;
        }
        throw new SecurityViolationError(
          `Command contains prohibited instruction: '${forbidden}'`,
          { command, violation: forbidden }
        );
      }
    }

    // Check for docker socket access
    if (!this.policy.allowHostDockerSocket && /docker\.sock/i.test(command)) {
      throw new SecurityViolationError(
        "Direct access to Docker daemon socket is strictly forbidden in sandbox",
        { command }
      );
    }
  }

  public validatePath(targetPath: string, workspaceRoot: string): string {
    const resolved = path.resolve(workspaceRoot, targetPath);

    // Escape check
    if (!resolved.startsWith(workspaceRoot)) {
      throw new SecurityViolationError(
        `Path traversal detected: target '${targetPath}' escapes workspace '${workspaceRoot}'`,
        { targetPath, workspaceRoot, resolved }
      );
    }

    // Disallowed path patterns check
    for (const pattern of this.policy.disallowedPathPatterns) {
      if (pattern.test(resolved)) {
        throw new SecurityViolationError(
          `Access to sensitive host path prohibited: '${resolved}'`,
          { targetPath, pattern: pattern.toString() }
        );
      }
    }

    return resolved;
  }

  public sanitizeEnv(rawEnv: NodeJS.ProcessEnv): Record<string, string> {
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(rawEnv)) {
      if (typeof value !== "string") continue;

      let isDisallowed = false;
      for (const pattern of this.policy.disallowedEnvPatterns) {
        if (pattern.test(key)) {
          isDisallowed = true;
          break;
        }
      }

      if (!isDisallowed) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
