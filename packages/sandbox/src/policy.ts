import { NetworkPolicy, ResourceLimits } from "@kazi-ai/task-schema";

export interface SandboxSecurityPolicy {
  networkPolicy: NetworkPolicy;
  resourceLimits: ResourceLimits;
  forbiddenCommands: string[];
  disallowedEnvPatterns: RegExp[];
  disallowedPathPatterns: RegExp[];
  allowHostDockerSocket: boolean;
}

export const DEFAULT_SANDBOX_POLICY: SandboxSecurityPolicy = {
  networkPolicy: "disabled",
  resourceLimits: {
    cpu_limit: 2.0,
    memory_limit_mb: 2048,
    process_limit: 64,
    disk_limit_mb: 4096,
  },
  forbiddenCommands: [
    "rm -rf /",
    ":(){ :|:& };:",
    "mkfs",
    "dd if=/dev/zero",
    "sudo",
    "shutdown",
    "reboot",
    "iptables",
    "ufw",
    "chmod -R 777 /",
    "curl", // blocked by default if network disabled
    "wget", // blocked by default if network disabled
  ],
  disallowedEnvPatterns: [
    /.*TOKEN.*/i,
    /.*KEY.*/i,
    /.*SECRET.*/i,
    /.*PASSWORD.*/i,
    /.*AUTH.*/i,
    /AWS_.*/i,
    /OPENAI_.*/i,
    /ANTHROPIC_.*/i,
    /GEMINI_.*/i,
    /GITHUB_.*/i,
  ],
  disallowedPathPatterns: [
    /^\/etc/i,
    /^\/var\/run\/docker\.sock/i,
    /^\/root/i,
    /^\/home\/[^/]+\/\.ssh/i,
    /^\/home\/[^/]+\/\.aws/i,
    /.*id_rsa.*/i,
    /.*id_ed25519.*/i,
    /\.env$/i,
  ],
  allowHostDockerSocket: false,
};

export class PolicyManager {
  private policy: SandboxSecurityPolicy;

  constructor(customPolicy: Partial<SandboxSecurityPolicy> = {}) {
    this.policy = {
      ...DEFAULT_SANDBOX_POLICY,
      ...customPolicy,
      resourceLimits: {
        ...DEFAULT_SANDBOX_POLICY.resourceLimits,
        ...(customPolicy.resourceLimits || {}),
      },
    };
  }

  public getPolicy(): SandboxSecurityPolicy {
    return this.policy;
  }
}
