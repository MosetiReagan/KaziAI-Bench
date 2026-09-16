# Sandboxing & Security Architecture

Evaluating autonomous AI agents that run arbitrary shell commands, manipulate filesystems, and install packages requires defense-in-depth isolation.

## 1. Sandboxing Layers

KaziAI Bench supports dual sandboxing execution models:

### 1.1 Local Isolated Process (`isolated-process`)
* **Confined Directory Root**: Process working directory confined strictly inside `.sandbox/<run-id>`.
* **Path Traversal Shield**: Filesystem access strictly blocks relative escapes (`../`) outside the sandbox directory.
* **Secret Stripping**: Environment variables are sanitized; host secrets (`AWS_SECRET_ACCESS_KEY`, `OPENAI_API_KEY`, etc.) are stripped from child processes.
* **Process Tree Lifespan**: Spawned processes and sub-shells are monitored with hard timeout limits and terminated with `SIGKILL`.

### 1.2 Docker Container Sandbox (`docker`)
* **Zero Network Access**: Invoked with `--network=none` to prevent unauthorized outbound API calls or dataset leakage.
* **Resource Quotas**: Hard CPU limits (`--cpus=2.0`), RAM constraints (`--memory=2048m`), and process limits (`--pids-limit=64`).
* **Non-Root Execution**: Runs as unprivileged container user to prevent privilege escalation.

## 2. Dynamic Secret Redaction

Before any trajectory, stdout stream, or tool execution record is written to disk:
1. Regex patterns detect JWTs, Bearer tokens, private keys, AWS credentials, and environment API keys.
2. Tokens are masked with `[REDACTED_API_KEY]` or `[REDACTED_JWT]`.
3. Ensures benchmark datasets exported for KaziAI Forge or public research remain safe and GDPR/SOC2 compliant.
