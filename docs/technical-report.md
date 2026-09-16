# KaziAI Bench: A Multi-Turn Execution Benchmark for Evaluating Agent Reliability, Tool Recovery, and System Safety

**Technical Report & Whitepaper**

*Reagan Moseti and the KaziAI Bench Working Group*  
`research@kaziai.org` — September 2026

---

### Abstract

While large language models (LLMs) achieve high pass rates on multiple-choice reasoning datasets (MMLU) and single-turn code generation benchmarks (HumanEval), their reliability degrades significantly when deployed as autonomous agents in executable system environments. Real-world tasks require executing multi-step terminal commands, interacting with mutable filesystems, maintaining transactional database consistency, recovering from syntax crashes, and negotiating complex Model Context Protocol (MCP) tool interfaces. 

We introduce **KaziAI Bench**, an open-source, multi-domain benchmark platform comprising **50 hand-crafted, human-verified tasks** spanning 8 core domains: Software Engineering, Debugging, Database Administration, Offensive/Defensive Security, System Administration, DevOps/Infrastructure, Web APIs, and Model Context Protocol tooling. 

Crucially, KaziAI Bench introduces:
1. **Deterministic Multi-Dimensional Verification**: Evaluating agents through compilation, unit test suites, database `EXPLAIN` query plans, and exploit scripts.
2. **The Autonomous Recovery Evaluator ($S_r$)**: Measuring whether an agent detects stderr crashes or runtime failures and autonomously recovers.
3. **Rigorous Anti-Gaming & Anti-Contamination**: Enforcing 35-point rubric validation, negative no-op invariants, adversarial hacker-fixer cheat audits, and canary GUID markers.
4. **Statistical Rigor**: Requiring $\ge 5$ seeded trials per task with mandatory public trajectory logs.

---

## 1. Motivation & Background

Existing benchmarks suffer from critical limitations when applied to production agents:
* **Passive Multiple-Choice / Chat**: Do not execute code or manipulate state.
* **SWE-bench**: Focuses almost exclusively on Python GitHub pull request diffs. Real agent engineering requires diagnosing runtime crashes, system daemon failures, broken database indexes, and network proxy misconfigurations.
* **Terminal-Bench**: Focuses on terminal commands but lacks dedicated verification for cross-stack database query plans, HTTP idempotency protocols, and modern Model Context Protocol (MCP) server recovery.

KaziAI Bench bridges this gap by evaluating agents operating across real software stacks with full terminal, filesystem, and tool access under hard sandbox constraints.

---

## 2. Benchmark Architecture & Task Design

### 2.1 The Task Suite
The KaziAI Bench Core suite (`kazi-bench-core-v2.0.0`) contains 50 distinct, hand-crafted tasks:

| Domain | Task Count | Primary Verification Mechanisms |
|---|---|---|
| **Coding** | 8 | Vitest / Jest unit tests, HMAC crypto verification, AST parsing |
| **Debugging** | 8 | Race condition detection, memory leak heap profiling, deadlock resolution |
| **Database** | 6 | SQLite/PostgreSQL `EXPLAIN QUERY PLAN`, connection pool checkout audits, SQL migration rollbacks |
| **Security** | 6 | Dynamic exploit script assertions (SQL injection, SSRF, prototype pollution, command injection) |
| **Terminal / Sysadmin** | 6 | `lsof` socket audits, `logrotate` validation, x509 TLS certificate validity inspection |
| **DevOps / Cloud** | 6 | Multi-stage Docker build size checks, Nginx upstream header configuration, Prometheus alert rules |
| **API / Web** | 6 | GraphQL query depth assertions, HTTP ETag caching (304 responses), webhook deduplication |
| **MCP Tooling** | 4 | MCP protocol version negotiation (2024-11-05), server timeout failover, dynamic schema migration |

### 2.2 Anti-Contamination Canaries
Every benchmark specification embeds unique canary GUIDs (`kazi-canary-[a-f0-9]{8}`) within descriptions, prompts, and metadata. Web crawlers and pre-training data filtering pipelines utilize these canaries to prevent benchmark data contamination into foundation model training corpora.

---

## 3. Evaluation Integrity & Statistical Methodology

### 3.1 Five-Trial Requirement
Single-run benchmark evaluations exhibit high variance due to temperature sampling and non-deterministic agent tool execution. KaziAI Bench enforces:
* A minimum of **5 independent trials per task** across distinct PRNG seeds ($N \ge 5$).
* Reporting mean pass rate, composite reliability score, and standard deviation ($\sigma$).

### 3.2 Public Trajectory Verification
To prevent unverified score inflation on public leaderboards, every submitted score must include full, step-by-step trajectory JSON logs detailing:
* Agent reasoning / thoughts
* Tool names, inputs, and stderr/stdout outputs
* Step execution duration (ms)
* Exact token counts and pricing costs ($)

---

## 4. Empirical Baseline Results

We evaluated three frontier agent configurations across the 50-task benchmark suite (5 trials per task, 250 total runs each):

| Agent / Framework | Foundation Model | Pass Rate (%) | Reliability Score (0-100) | Autonomous Recovery (%) | Mean Latency (s) | Cost / Task ($) |
|---|---|---|---|---|---|---|
| **Kazi Reference Agent** | Claude 3.5 Sonnet (20241022) | **88.4%** ($\pm 2.1$) | **90.2** | **84.6%** | 14.2s | $0.0084 |
| **Kazi Reference Agent** | GPT-4o (2024-08-06) | **79.2%** ($\pm 3.4$) | **82.5** | **69.8%** | 16.8s | $0.0092 |
| **LangChain ReAct** | GPT-4o | **68.0%** ($\pm 4.2$) | **70.1** | **38.5%** | 22.4s | $0.0142 |
| **AutoGPT v0.5** | GPT-4o-mini | **48.4%** ($\pm 5.1$) | **46.7** | **24.0%** | 38.1s | $0.0041 |

### Key Findings:
1. **Autonomous Recovery is the Bottleneck**: While Claude 3.5 Sonnet recovered from initial syntax or runtime failures in 84.6% of cases, older or unspecialized agents (AutoGPT) often looped into repetitive identical tool calls upon receiving an error message.
2. **Cross-Stack Heterogeneity**: Agents scored highest on pure algorithmic coding (82%), but struggled most on distributed database connection pool leaks (52%) and Model Context Protocol timeout failovers (48%).

---

## 5. Defense-in-Depth Sandboxing Threat Model

KaziAI Bench implements dual-mode containment:
* **Process Confinement**: Child processes run in isolated process trees with restricted working directories (`.sandbox/<run-id>`), path traversal validation blocking directory escapes (`../`), and complete environment variable secret stripping.
* **Network Isolation**: Zero network egress (`--network=none`), preventing data exfiltration or external test gaming.
* **Deterministic Quotas**: Explicit non-negotiable caps on execution time (max 300s), RAM (512MB–2048MB), and process counts. Overriding constraints invalidates benchmark submissions.
