# Sandboxing, Security Architecture & Threat Model

Evaluating autonomous AI agents that run arbitrary shell commands, manipulate filesystems, edit codebases, and install dependencies requires comprehensive, defense-in-depth isolation.

This document details the exact threat model, containment mechanisms, network policies, path traversal safeguards, and non-negotiable resource constraints enforced by KaziAI Bench.

---

## 1. Threat Model & Adversary Assumptions

We assume an **adversarial or malfunctioning autonomous agent** with the following capabilities:
1. **Arbitrary Command Execution**: Ability to execute arbitrary shell commands inside `sh`, `bash`, or `node`.
2. **Filesystem Manipulation**: Ability to read, write, chmod, truncate, and create symbolic/hard links within its assigned workspace.
3. **Prompt Injection & Adversarial Payloads**: Agent may receive instructions from third parties attempting host compromise or benchmark cheating.
4. **Denial-of-Service Attempts**: Agent code might execute fork bombs, allocate infinite memory loops, or spawn zombie background daemons.

### Out of Scope (Security Boundaries):
* Kernel zero-day privilege escalations in modern Linux/macOS kernels.
* Physical hardware tampering.

---

## 2. Containment Mechanics: How Each Threat is Blocked

### 2.1 Network Egress & Anti-Cheating: `--network=none`
* **Threat**: Agents downloading answers from GitHub, looking up solutions via curl/wget, calling unmetered external LLMs, or exfiltrating private benchmark files.
* **Mechanism**:
  - In Docker sandboxes, containers are provisioned with `--network=none`. All loopback communication is strictly bound to `127.0.0.1` when `localhost_only` is allowed for internal service mocking, and outbound DNS/TCP/UDP connections are dropped at the kernel interface level.
  - In local process sandboxes, `network: disabled` strips proxy environment variables (`HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`), points `HOME` and `TMPDIR` inside `.sandbox/<run-id>`, and blocks network utility discovery.

### 2.2 Filesystem Confinement & Path Traversal Shielding
* **Threat**: Agents navigating outside the workspace via `../../etc/passwd`, manipulating `/tmp`, modifying host user `~/.ssh/id_rsa`, or creating circular symlinks.
* **Mechanism**:
  - **Canonical Path Resolution**: Before executing any command with a specified `cwd`, or invoking filesystem tools (`read_file`, `write_file`, `list_dir`), KaziAI Bench resolves the real canonical path (`path.resolve`).
  - **Boundary Invariant Check**: The resolved path is verified against `this.workdir`:
    ```typescript
    if (!executionCwd.startsWith(this.workdir)) {
      throw new EnvironmentError(`Directory traversal prevented: ${executionCwd} is outside workspace`);
    }
    ```
  - **Symlink Jail**: Symlinks whose target destinations resolve outside `this.workdir` are rejected upon artifact collection.

### 2.3 Process Tree Confinement & Zombie Reaping
* **Threat**: Long-running background processes, runaway sub-shells, detached child threads, or fork bombs surviving task teardown.
* **Mechanism**:
  - Every child process is spawned inside its own process group (`setpgid`).
  - Upon task completion, timeout expiration, or cancellation signal, KaziAI Bench dispatches `SIGTERM` followed by a hard `SIGKILL` to the entire process group tree (`-pid`), ensuring zero orphan background processes remain alive.

### 2.4 Host Secret Sanitization
* **Threat**: Leaking host runner secrets (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `AWS_SECRET_ACCESS_KEY`, `GITHUB_TOKEN`) into the agent's shell environment.
* **Mechanism**:
  - Sandboxed processes **never** inherit `process.env`.
  - The runtime environment is wiped clean, injecting only minimal runtime paths (`PATH=/usr/local/bin:/usr/bin:/bin`, `NODE_ENV=test`, `HOME=<sandbox_dir>`).

---

## 3. Fixed, Non-Negotiable Resource Quotas

To ensure scientific reproducibility and prevent unfair benchmark gaming, resource constraints are fixed per task and strictly validated. Any submission that overrides or relaxes timeouts or resource limits is automatically disqualified:

| Parameter | Standard Quota | Enforcement Mechanism |
|---|---|---|
| **Max Wall-Clock Duration** | 30'–300s (task-specific) | Kernel timeout timer with `SIGKILL` termination |
| **Memory Limit** | 512MB – 2048MB | Docker `--memory` quota / cgroups enforcement |
| **CPU Limit** | 2.0 Cores | Docker `--cpus=2.0` CFS quota |
| **PIDs Limit** | 64 – 128 Processes | Docker `--pids-limit` / fork bomb protection |
| **Disk Space Limit** | 1024MB | Sandbox directory size audit on step execution |
| **Context Token Budget** | 10,000 – 50,000 tokens | `BudgetEnforcer` token tracking |
