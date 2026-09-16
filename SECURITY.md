# Security Policy & Vulnerability Disclosure Program

KaziAI Bench executes AI agents that run arbitrary shell commands, write code, and manage infrastructure in isolated environments. Ensuring that agent code cannot compromise the host system, escape container boundaries, or exfiltrate private credentials is paramount.

---

## 1. Scope & Vulnerability Classifications

We actively encourage responsible disclosure of vulnerabilities in the following areas:

### High & Critical Severity
* **Sandbox Escapes**: Any mechanism allowing an agent executing inside a sandbox (process confinement or Docker `--network=none`) to access files, processes, or devices on the host machine outside its designated `.sandbox/<run-id>` directory.
* **Credential & Secret Leakage**: Any failure of the `SecretRedactor` pipeline resulting in host API keys, JWTs, AWS tokens, or environment variables leaking into persisted trajectories, datasets, or web dashboards.
* **Arbitrary Host Code Execution**: Bypasses in command sanitization or path traversal protection that execute commands on the host outside the confined subshell.
* **Privilege Escalation**: Mechanisms allowing non-root sandbox processes to gain root permissions on the host or inside a container.

### Medium Severity
* **Grader Bypass / Adversarial Cheating**: Exploits allowing an agent to trick `VerifierDispatcher` into scoring a task as passed without actually solving the stated requirements.
* **Resource Denial of Service**: Fork bombs or memory exhaustion attacks capable of evading process tree limits and hanging the host runner.

---

## 2. Coordinated Vulnerability Disclosure Process

Please report all security vulnerabilities privately to our security team:

* **Primary Security Contact:** `security@kaziai.org`
* **Maintainer Direct Email:** `reagan@kaziai.org`
* **PGP Fingerprint:** `8F3C 41D8 920E 74B2 611A  08E2 4D92 1A3E 5B01 7724`

### Disclosure Timeline:
1. **Initial Response**: Within 24 hours of report receipt.
2. **Triage & Reproducibility Assessment**: Within 48 hours, with severity scoring (CVSS v3.1).
3. **Remediation & Patch Development**: Target within 7 calendar days for Critical/High issues.
4. **Advisory & Release**: A coordinated public security advisory and CVE assignment will be published alongside the patched release.

Please **do not** file public GitHub issues, discussions, or pull requests for undisclosed security vulnerabilities.

---

## 3. Supported Versions

| Version Suite | Security Support Status |
|---|---|
| **2.0.x** | :white_check_mark: Current Supported Release |
| **1.0.x** | :white_check_mark: Critical security patches only |
| **< 1.0.0** | :x: End of life (unsupported) |

---

## 4. Security Sandbox Guarantees

Every benchmark evaluation executed under KaziAI Bench is constrained by four mandatory security layers:

1. **Strict Process-Tree Isolation**: Monitored sub-shells spawned in dedicated process groups (`setpgid`), terminated via `SIGKILL` on timeout.
2. **Non-Negotiable Path Confinement**: Working directory boundaries strictly prevent path traversal escapes (`../`).
3. **Zero Network Access**: Docker sandboxes execute with `--network=none`. Process sandboxes default to disabled sockets.
4. **Automated Secret Stripping**: All host environment variables are sanitized prior to spawning agent processes.
