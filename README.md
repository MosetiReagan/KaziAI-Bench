<div align="center">

# KaziAI Bench

### The Production-Grade AI Agent Reliability Benchmark

[![CI Tests](https://github.com/MosetiReagan/KaziAI-Bench/actions/workflows/ci.yml/badge.svg)](https://github.com/MosetiReagan/KaziAI-Bench/actions)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg)](https://www.typescriptlang.org/)
[![Python SDK](https://img.shields.io/badge/PyPI-kazi--bench-3776AB.svg)](https://pypi.org/project/kazi-bench/)
[![Live Leaderboard](https://img.shields.io/badge/Leaderboard-Live%20Dashboard-10B981.svg)](https://mosetireagan.github.io/KaziAI-Bench/)

*Measure whether autonomous AI agents can actually complete real, multi-step engineering tasks safely, efficiently, and recover when things go wrong.*

---

</div>

## Overview

**KaziAI Bench** (`kazi-bench`) is an open-source, production-grade benchmark and evaluation platform for AI agents operating in realistic, executable environments.

KaziAI Bench is **not** a chatbot benchmark or multiple-choice QA test. It evaluates autonomous agents performing real multi-step tasks across:
* **Terminal & Shell Execution**
* **Real Multi-File Codebases & Tests**
* **Databases (SQLite & PostgreSQL schema tuning, queries, EXPLAIN plans)**
* **Web Services & REST APIs (Idempotency, status codes, payload handling)**
* **Security Exploitation & Remediation (Command injection, auth bypasses)**
* **DevOps & Infrastructure (Container healthchecks, Alpine compatibility, disk hogs)**
* **Model Context Protocol (MCP) Tool Recovery & Schema Migration**

---

## Benchmark Philosophy

Modern frontier models score 90%+ on multiple-choice synthetic benchmarks, yet fail when given terminal access to a real repository.

KaziAI Bench measures what matters in production:

1. **Deterministic Verification**: Tasks are verified via compiler exits, unit tests, SQLite query plans, and exploit scripts — never brittle heuristics.
2. **Autonomous Recovery**: Does the agent diagnose stderr crashes, syntax errors, or tool failures and recover without human input?
3. **Multi-Dimensional Metrics**: Evaluates pass rate, latency, token discipline, financial cost ($/task), and safety violations.
4. **Anti-Gaming Seeded Variants**: Mulberry32 deterministic PRNG randomizes ports, secrets, and task constraints across seeds.
5. **Defense-in-Depth Sandboxing**: Native process tree confinement with path traversal shielding, or Docker `--network=none` isolation.

---

## Quickstart

### 1. Installation

Install the CLI globally or run it directly with `pnpm`:

```bash
# Clone the repository
git clone https://github.com/MosetiReagan/KaziAI-Bench.git
cd KaziAI-Bench

# Install monorepo dependencies
pnpm install

# Build all packages & CLI
pnpm build

# Run system environment doctor
pnpm bench doctor
```

### 2. Run an Evaluation

```bash
# List all 10 out-of-the-box benchmark tasks
pnpm bench list

# Execute an evaluation against a specific task
pnpm bench run coding.fix-auth --model gpt-4o

# Execute an entire benchmark suite
pnpm bench run-suite coding-v1
```

### 3. Compare Models & Detect Regressions

```bash
# Compare candidate run against baseline
pnpm bench compare run_01JH8A912K run_01JH8A714M
```

### 4. Interactive Web Dashboard

Launch the React + Tailwind visualization dashboard:

```bash
pnpm --filter @kazi-ai/web dev
```

Navigate to `http://localhost:3000` to browse the **Live Leaderboard**, **Run History**, **Step-by-Step Trajectory Explorer**, and **Differential Regression Matrix**.

---

## Benchmark Suite Catalog

KaziAI Bench ships with 10 genuinely executable benchmark tasks with realistic repository fixtures:

| Task ID | Category | Difficulty | Description | Deterministic Verifier |
|---|---|---|---|---|
| `coding.fix-auth` | Coding | Medium | Repair JWT auth token validation bypass | Vitest / Jest exit code |
| `coding.fix-pagination` | Coding | Easy | Fix off-by-one pagination bug | Vitest / Jest exit code |
| `debugging.api-500` | Debugging | Easy | Trace & fix unhandled TypeError crash | Vitest / Jest exit code |
| `debugging.worker-failure` | Debugging | Medium | Handle async unhandled promise rejection | Vitest / Jest exit code |
| `database.query-optimization` | Database | Medium | Add missing compound index on events table | SQLite `EXPLAIN QUERY PLAN` |
| `security.command-injection` | Security | Hard | Remediate command injection vulnerability | Exploit assertion script |
| `terminal.disk-diagnosis` | Terminal | Easy | Diagnose runaway disk usage in `/var/log` | Filesystem & size verifier |
| `devops.docker-healthcheck` | DevOps | Medium | Repair Alpine curl incompatibility with wget | Command & exit code verifier |
| `api.webhook-idempotency` | API | Medium | Implement idempotent webhook deduplication | Vitest / Jest exit code |
| `mcp.tool-selection` | MCP | Medium | Recover from deprecated MCP tool schema | Dynamic schema verifier |

---

## Python SDK

Install the official Python client:

```bash
pip install kazi-bench
```

```python
from kazi_bench import KaziBenchClient

client = KaziBenchClient(base_url="http://localhost:4000", api_key="kazi_test_admin_key_12345")

# Enqueue evaluation
run = client.create_run(task_id="coding.fix-auth", agent_id="my-custom-agent", model_id="gpt-4o")
print(f"Enqueued run: {run.id}")

# Fetch live leaderboard
leaderboard = client.get_leaderboard()
for entry in leaderboard:
    print(f"{entry['agentId']}: {entry['passRate']}% pass rate")
```

---

## GitHub Action Integration

Embed KaziAI Bench into your CI/CD pipeline to gate model releases on reliability:

```yaml
name: Agent Reliability Gate
on: [pull_request]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: kazi-ai/kazi-bench@v1
        with:
          suite: "kazi-bench-core-v1"
          min-pass-rate: "80.0"
          max-regression: "0.0"
```

---

## License

KaziAI Bench is open-source software licensed under the [Apache-2.0 License](LICENSE).
