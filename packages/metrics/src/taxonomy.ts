export const FAILURE_TYPES = [
  "TASK_FAILURE",
  "VERIFICATION_FAILURE",
  "TOOL_FAILURE",
  "TIMEOUT",
  "RESOURCE_EXHAUSTION",
  "INVALID_TOOL_CALL",
  "AUTHORIZATION_FAILURE",
  "SECURITY_VIOLATION",
  "ENVIRONMENT_FAILURE",
  "REGRESSION",
  "INCOMPLETE_TASK",
  "WRONG_APPROACH",
  "INFINITE_LOOP",
  "EXCESSIVE_RETRY",
] as const;

export type FailureType = typeof FAILURE_TYPES[number];

export interface StructuredFailure {
  type: FailureType;
  message: string;
  source: "agent" | "verifier" | "environment" | "system";
  stepIndex?: number;
  contributingEvents: string[];
  evidence?: string;
  timestamp: string;
}

export class FailureClassifier {
  public static classify(error: unknown, stepIndex?: number): StructuredFailure {
    const msg = error instanceof Error ? error.message : String(error);
    const time = new Date().toISOString();

    if (/timeout/i.test(msg)) {
      return {
        type: "TIMEOUT",
        message: msg,
        source: "agent",
        stepIndex,
        contributingEvents: ["Agent exceeded maximum allotted duration or per-command timeout"],
        timestamp: time,
      };
    }

    if (/security|forbidden|prohibited|escape/i.test(msg)) {
      return {
        type: "SECURITY_VIOLATION",
        message: msg,
        source: "agent",
        stepIndex,
        contributingEvents: ["Agent executed prohibited command or attempted path traversal"],
        timestamp: time,
      };
    }

    if (/loop|identical/i.test(msg)) {
      return {
        type: "INFINITE_LOOP",
        message: msg,
        source: "agent",
        stepIndex,
        contributingEvents: ["Agent executed duplicate tool calls without state variation"],
        timestamp: time,
      };
    }

    if (/environment|docker|container|spawn/i.test(msg)) {
      return {
        type: "ENVIRONMENT_FAILURE",
        message: msg,
        source: "environment",
        stepIndex,
        contributingEvents: ["Host environment or container runtime error"],
        timestamp: time,
      };
    }

    return {
      type: "TASK_FAILURE",
      message: msg,
      source: "agent",
      stepIndex,
      contributingEvents: ["Agent was unable to successfully satisfy task requirements"],
      timestamp: time,
    };
  }
}
