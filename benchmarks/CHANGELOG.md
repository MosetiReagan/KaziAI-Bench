# KaziAI Bench Task Suite Changelog & Continuous Validation Policy

All benchmark tasks in KaziAI Bench undergo continuous automated re-validation to prevent dependency drift, environment breakage, or grader circumvention.

## Continuous Validation Policy

1. **Deterministic Oracle Validation**: Every task must pass 100% when executed with the reference oracle solution.
2. **Negative No-Op Baseline**: Every task must fail ($S_v < 0.1$) on a clean, untouched fixture.
3. **Adversarial Cheat Resistance**: Every task verifier is audited against the `HackerFixerLoop` cheat suite to prevent trivial bypasses (`exit 0`, empty file creation, test runner replacement).
4. **Frozen Environment Images**: External network calls during task execution are prohibited (`network: disabled`). All system dependencies, language packages, and test runners must be offline-pinned to guarantee long-term evaluation reproducibility.
5. **Drift Auditing**: If an underlying compiler or runtime update causes task failure or instruction mismatch, the issue is resolved and publicly recorded in this changelog.

---

## Suite Version History

### [kazi-bench-core-v2.0.0] - 2026-09-16

#### Added
* **Scaled Task Catalog**: Expanded the hand-crafted, human-verified task suite from 10 to **50 production benchmark tasks** across 8 core domains:
  - `coding` (8 tasks: async refactoring, ReDoS mitigation, LRU cache, token bucket, stream parser, circuit breaker, auth bypass, pagination)
  - `debugging` (8 tasks: race conditions, event listener memory leaks, deadlocks, currency float bugs, CORS preflight, zombie processes, API 500, worker crashes)
  - `database` (6 tasks: connection pool leaks, N+1 query optimization, schema rollback, table partitioning, VACUUM compaction, index tuning)
  - `security` (6 tasks: SQL injection, path traversal, SSRF filtering, YAML unsafe deserialization, prototype pollution, command injection)
  - `terminal` (6 tasks: log rotation, leaked socket cleanup, TLS cert expiration audit, cron syntax repair, SSH key permission hardening, disk usage diagnosis)
  - `devops` (6 tasks: multi-stage Dockerfiles, Nginx reverse proxy SSL, resilient systemd units, envsubst templates, Prometheus alerts, Alpine healthchecks)
  - `api` (6 tasks: GraphQL depth limit, HTTP ETag caching, SSE keep-alive heartbeats, cursor pagination, JSON Schema validation, webhook idempotency)
  - `mcp` (4 tasks: protocol handshake negotiation, server timeout failover, dynamic resource subscription, tool schema recovery)
* **Anti-Contamination Canaries**: Injected unique GUID markers (`kazi-canary-*`) across all tasks to monitor and flag pre-training dataset contamination.
* **35-Point Automated Rubric**: Integrated `TaskValidationPipeline` checking static constraints, fixture paths, canary presence, and no-op invariants.
* **Hacker-Fixer Loop**: Added automated adversarial cheat suite testing against trivial grader bypasses.

#### Changed
* Fixed composite score weights across all tasks to strictly sum to 1.0.
* Standardized resource limits with explicit CPU (`2.0`), memory (`512MB`–`2048MB`), and duration caps.

---

### [kazi-bench-core-v1.0.0] - 2026-09-15

#### Initial Release
* Seed task set of 10 executable benchmark tasks across coding, database, security, and terminal commands.
* Deterministic verifiers and isolated process sandboxing.
