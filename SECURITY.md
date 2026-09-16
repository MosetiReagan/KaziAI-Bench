# Security Policy

## Reporting Security Issues

KaziAI Bench executes AI agents in isolated sandboxes. Ensuring that untrusted agent code cannot compromise the host environment is critical to the mission of this benchmark.

If you believe you have discovered a vulnerability in KaziAI Bench (such as a sandbox escape, unintended credential leakage, or host compromise vector), please report it responsibly:

* **Email:** security@kaziai.org
* Please do **not** open public GitHub issues for security-sensitive vulnerabilities until a patch is released.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Sandbox Principles

1. **Isolation First**: Default network policy is disabled unless explicitly declared.
2. **Never Mount Host Secrets**: Never mount `/var/run/docker.sock`, `/etc`, or host user credentials into the agent workspace.
3. **Resource Caps**: CPU, memory, process counts, and execution timeouts are enforced on every run.
4. **Redaction**: Secrets and API tokens are redacted before persistence in traces and logs.
