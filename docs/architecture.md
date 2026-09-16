# KaziAI Bench — Architecture & Technical Design

## 1. System Overview

KaziAI Bench is an evaluation and benchmarking platform designed to measure the capability, reliability, efficiency, and autonomous recovery behavior of AI agents operating in realistic, multi-step environments.

Unlike synthetic multi-choice QA or passive chatbot benchmarks, KaziAI Bench executes agents in controlled local process sandboxes or isolated Docker containers, providing them with realistic system capabilities (terminal execution, filesystem manipulations, SQLite/Postgres databases, HTTP APIs, and Model Context Protocol (MCP) tools).

```
 ┌────────────────────────────────────────────────────────┐
 │                      CLI & API                         │
 └──────────────────────────┬─────────────────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │      ExecutionEngine      │
              └─────────────┬─────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
┌──────▼──────┐      ┌──────▼──────┐      ┌──────▼──────┐
│ Environment │      │    Agent    │      │  Verifier   │
│  (Sandbox)  │      │  (Adapter)  │      │  (Checks)   │
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │  Trajectory & Redaction   │
              └─────────────┬─────────────┘
                            │
              ┌─────────────▼─────────────┐
              │     Scoring & Metrics     │
              └───────────────────────────┘
```

## 2. Core Subsystems

### 2.1 Task Specification & Deterministic Variants (`@kazi-ai/task-schema`)
* Strict Zod runtime validation and JSON Schema export.
* Seeded Mulberry32 pseudo-random number generator for deterministic anti-gaming variants (randomized ports, auth tokens, file contents).
* Standard task categories: `coding`, `debugging`, `database`, `security`, `terminal`, `devops`, `api`, `mcp`, `research`.

### 2.2 Sandboxing & Execution Isolation (`@kazi-ai/sandbox`, `@kazi-ai/environment-sdk`)
* Dual-mode runtime: Native process tree isolation with path confinement and `--network=none` Docker sandboxing.
* Command sanitization, path escape prevention, and secret environment stripping.
* Complete filesystem snapshotting, state restoration, SHA-256 artifact verification, and guaranteed cleanup.

### 2.3 Agent Adapter & Guardrails (`@kazi-ai/agent-sdk`)
* Abstract agent adapter lifecycle with full token and cost instrumentation.
* Out-of-the-box support for:
  - `ReferenceAgent`: Autonomous tool-calling agent with self-healing heuristics.
  - `HttpAgentAdapter`: Connects any external HTTP/REST agent or microservice.
  - `McpClient`: Dynamically discovers and proxies tools from MCP servers.
* `ToolGuardrail`: Hard limits on execution steps, timeout budgets, and repetitive loop detection.

### 2.4 Multi-Dimensional Verifiers (`@kazi-ai/verifier`)
* Zero-trust programmatic verification:
  - `CommandVerifier`: Exit code, stdout matching, regex validation.
  - `FilesystemVerifier`: File presence, absence, content hashing, regex assertions.
  - `HttpVerifier`: Endpoint response status codes and body content.
  - `DatabaseVerifier`: Schema validation, record assertions, and SQL query plan inspection.
  - `SecurityVerifier`: Proactive exploit payload testing to verify vulnerability remediation.
  - `LlmJudgeVerifier`: Secondary semantic verification with temperature 0 reproducibility.

### 2.5 Metrics, Failure Taxonomy & Recovery (`@kazi-ai/metrics`)
* Standardized failure taxonomy:
  - `AGENT_TIMEOUT`, `AGENT_LOOP_DETECTED`, `TOOL_CALL_MALFORMED`, `COMMAND_FAILED`
  - `SYNTAX_ERROR`, `LOGICAL_ERROR`, `SECURITY_VIOLATION`, `BUDGET_EXCEEDED`
* Autonomous Recovery Evaluator: Accurately scores whether an agent detected an initial error and corrected its trajectory without failing the benchmark.
* Weighted composite scoring:
  $$\text{Composite Score} = w_v \cdot S_v + w_e \cdot S_e + w_c \cdot S_c + w_s \cdot S_s + w_r \cdot S_r$$

### 2.6 Streaming Tracing & Dataset Export (`@kazi-ai/tracing`, `@kazi-ai/dataset`)
* Millisecond-level event capture (`TASK_START`, `TOOL_CALL`, `TOOL_RESULT`, `AGENT_THOUGHT`, `TASK_END`).
* Automatic redaction of API keys, JWTs, private keys, passwords, and authorization tokens.
* Replay engine with divergence detection to verify environmental determinism.
* Export to standardized JSONL for immediate fine-tuning and evaluation in KaziAI Forge.
