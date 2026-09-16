# Benchmark Comparison & Positioning

How KaziAI Bench compares against other leading AI agent benchmarks: **SWE-bench**, **Terminal-Bench**, **GitTaskBench**, and **SecCodeBench**.

| Dimension | SWE-bench (Princeton) | Terminal-Bench (Snorkel AI) | GitTaskBench | SecCodeBench | **KaziAI Bench** |
|---|---|---|---|---|---|
| **Primary Focus** | Python GitHub issue resolution (PR diffs) | Terminal CLI execution & bash scripts | Git repository manipulation | Static code vulnerability auditing | **Multi-turn Agent Reliability, Recovery & System Execution** |
| **Execution Environment** | Docker per repo | Local / Docker container | Git repos | Static analysis / compiler | **Isolated Process Tree & Docker (`--network=none`)** |
| **Task Count** | 2,294 (SWE-bench lite: 300) | 89 tasks | 40 tasks | 120 tasks | **50 production tasks (scalable suite)** |
| **Domain Diversity** | Software Engineering (Python only) | Linux sysadmin, ML, scientific computing | Git workflows | Security vulnerability detection | **8 Domains**: Coding, Debugging, DB, Security, Terminal, DevOps, API, MCP |
| **Autonomous Recovery ($S_r$)** | ❌ Not measured | ❌ Not measured | ❌ Not measured | ❌ Not measured | **✅ Yes**: Explicit metric scoring self-healing after error |
| **Database & Query Plans** | ❌ None | ❌ None | ❌ None | ❌ None | **✅ Yes**: SQLite/Postgres `EXPLAIN QUERY PLAN` verifiers |
| **MCP Tool Recovery** | ❌ None | ❌ None | ❌ None | ❌ None | **✅ Yes**: Model Context Protocol handshake & fallback |
| **Adversarial Audit** | ❌ None | ⚠️ Manual Review | ❌ None | ❌ None | **✅ Yes**: Automated `HackerFixerLoop` cheat tester |
| **Trial Rigor** | Single trial per task | 5 trials per task | Single trial | Single trial | **✅ Yes**: Mandatory $\ge 5$ seeded trials with full trajectories |
| **Contamination Control** | Git commit timestamps | Canary strings | None | None | **✅ Yes**: Unique GUID Canary markers (`kazi-canary-*`) |

---

## What Makes KaziAI Bench Unique?

### 1. Cross-Stack Breadth Beyond Pure Python Diffs
SWE-bench is an exceptional benchmark for software engineers patching Python repositories, but production agents in real companies manage infrastructure, optimize database performance, resolve API gateway timeouts, and fix Linux system configurations. KaziAI Bench evaluates agents where modern architectures live: databases, network layers, containers, and web services.

### 2. The Autonomous Recovery Metric ($S_r$)
Most benchmarks measure binary outcome: did the final state match or not? KaziAI Bench is the first benchmark to explicitly isolate and score **autonomous error diagnosis and recovery**. When an agent runs a command that crashes with an unhandled exception or syntax error, does it understand the stderr stack trace and adjust its strategy, or does it enter an infinite loop?

### 3. Model Context Protocol (MCP) Resilience
As the AI industry standardizes on the Model Context Protocol (MCP) for tool use, agent reliability will depend on navigating dynamic server registrations, schema migrations, and unresponsive tool providers. KaziAI Bench is the first benchmark to include dedicated MCP resilience tasks.
