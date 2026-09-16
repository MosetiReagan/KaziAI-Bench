export type ErrorKind =
  | "AGENT_FAILURE"
  | "TASK_FAILURE"
  | "ENVIRONMENT_FAILURE"
  | "INFRASTRUCTURE_FAILURE"
  | "VERIFIER_FAILURE"
  | "PROVIDER_FAILURE"
  | "TIMEOUT"
  | "RESOURCE_LIMIT_EXCEEDED"
  | "SECURITY_VIOLATION";

export class KaziError extends Error {
  public readonly kind: ErrorKind;
  public readonly isRecoverable: boolean;
  public readonly metadata?: Record<string, unknown>;

  constructor(message: string, kind: ErrorKind, options?: { isRecoverable?: boolean; metadata?: Record<string, unknown> }) {
    super(message);
    this.name = "KaziError";
    this.kind = kind;
    this.isRecoverable = options?.isRecoverable ?? false;
    this.metadata = options?.metadata;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InfrastructureError extends KaziError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, "INFRASTRUCTURE_FAILURE", { isRecoverable: false, metadata });
    this.name = "InfrastructureError";
  }
}

export class EnvironmentError extends KaziError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, "ENVIRONMENT_FAILURE", { isRecoverable: false, metadata });
    this.name = "EnvironmentError";
  }
}

export class SecurityViolationError extends KaziError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, "SECURITY_VIOLATION", { isRecoverable: false, metadata });
    this.name = "SecurityViolationError";
  }
}

export class TimeoutError extends KaziError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, "TIMEOUT", { isRecoverable: false, metadata });
    this.name = "TimeoutError";
  }
}

export class ResourceLimitError extends KaziError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, "RESOURCE_LIMIT_EXCEEDED", { isRecoverable: false, metadata });
    this.name = "ResourceLimitError";
  }
}

export class VerifierError extends KaziError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, "VERIFIER_FAILURE", { isRecoverable: false, metadata });
    this.name = "VerifierError";
  }
}
