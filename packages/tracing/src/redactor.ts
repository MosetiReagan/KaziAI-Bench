export interface RedactionRule {
  name: string;
  pattern: RegExp;
  replacement: string;
}

export const DEFAULT_REDACTION_RULES: RedactionRule[] = [
  { name: "OpenAI API Key", pattern: /sk-[a-zA-Z0-9_-]{24,}/g, replacement: "[REDACTED_API_KEY]" },
  { name: "Bearer Token", pattern: /Bearer\s+[a-zA-Z0-9._~+/-]+=*/gi, replacement: "Bearer [REDACTED_TOKEN]" },
  { name: "AWS Key", pattern: /AKIA[0-9A-Z]{16}/g, replacement: "[REDACTED_AWS_KEY]" },
  { name: "Generic Secret Token", pattern: /(?:token|secret|password|passwd|api_key|apikey)\s*[:=]\s*["']?([^\s"';&]+)["']?/gi, replacement: "$1=[REDACTED_SECRET]" },
  { name: "Private Key Block", pattern: /-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+PRIVATE KEY-----/g, replacement: "[REDACTED_PRIVATE_KEY]" },
  { name: "JWT Token", pattern: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, replacement: "[REDACTED_JWT]" },
];

export class SecretRedactor {
  private rules: RedactionRule[];

  constructor(customRules: RedactionRule[] = []) {
    this.rules = [...DEFAULT_REDACTION_RULES, ...customRules];
  }

  public redactString(text: string): string {
    let result = text;
    for (const rule of this.rules) {
      result = result.replace(rule.pattern, rule.replacement);
    }
    return result;
  }

  public redactObject<T>(value: T): T {
    if (value === null || value === undefined) return value;
    if (typeof value === "string") return this.redactString(value) as unknown as T;
    if (Array.isArray(value)) return value.map((item) => this.redactObject(item)) as unknown as T;

    if (typeof value === "object") {
      const copy: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        if (/password|secret|token|authorization|apikey|api_key/i.test(k)) {
          copy[k] = "[REDACTED_SECRET]";
        } else {
          copy[k] = this.redactObject(v);
        }
      }
      return copy as T;
    }

    return value;
  }
}
