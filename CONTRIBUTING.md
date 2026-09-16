# Contributing to KaziAI Bench

Thank you for your interest in contributing to **KaziAI Bench**!

KaziAI Bench is an open-source evaluation platform designed to measure the reliability, capability, efficiency, safety, and recovery behavior of AI agents operating in realistic executable environments.

## Core Rules for Benchmark Contributions

1. **Deterministic Verification First**: Every task must be verified programmatically whenever possible (tests, assertions, database states, filesystem diffs, exit codes). Secondary LLM judges may be added, but must not replace deterministic checks.
2. **No Data Leakage**: Tasks must never expose expected solutions or hidden test files to the agent context.
3. **Reproducibility**: Tasks must be deterministic from an execution seed and cleanly tear down environments.
4. **Agent Neutrality**: Benchmarks must not be tailored to or favor any single agent framework.

## Development Workflow

1. Fork and clone the repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run tests:
   ```bash
   pnpm test
   ```
4. Run linter and typecheck:
   ```bash
   pnpm lint
   pnpm typecheck
   ```
5. Submit a Pull Request following conventional commits:
   `feat(...)`, `fix(...)`, `test(...)`, `docs(...)`.
