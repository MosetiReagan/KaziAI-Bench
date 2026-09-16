# Task Authoring Guide

Learn how to write reproducible, verifiable benchmark tasks for KaziAI Bench.

## 1. Directory Structure

Each task lives in `benchmarks/<category>/<task-id>/`:

```
benchmarks/
└── coding/
    └── fix-auth/
        ├── task.yaml          # Task definition & verifier configuration
        └── fixtures/          # Isolated workspace source files
            ├── package.json
            ├── src/
            │   └── auth.ts
            └── tests/
                └── auth.test.ts
```

## 2. Defining `task.yaml`

A task manifest specifies metadata, sandbox constraints, agent instructions, setup commands, and verifiers.

```yaml
id: coding.fix-auth
name: "Fix Authentication Token Validation"
version: "1.0.0"
category: coding
difficulty: medium
description: "Repair token validation bypass in auth middleware and ensure security tests pass."
author: "KaziAI Research"
tags: ["auth", "jwt", "security", "node"]

agent:
  tools:
    - terminal
    - filesystem
  initial_prompt: |
    An authentication token validation vulnerability was reported in src/auth.ts.
    Users with expired tokens or crafted headers are able to bypass validation.
    Inspect the implementation, repair the flaw, and verify that npm test passes.

constraints:
  network: disabled
  max_duration_seconds: 60
  max_steps: 15
  max_tokens: 15000
  forbidden_commands:
    - "rm -rf /"
    - "shutdown"

environment:
  type: isolated-process
  fixture_path: coding/fix-auth/fixtures

setup:
  - command: "npm install --prefer-offline"
    description: "Install local dependencies"

verification:
  checks:
    - id: verify-tests
      type: command
      command: "npm test"
      expected_exit_code: 0
      weight: 0.7
    - id: verify-clean-auth
      type: filesystem
      file_path: "src/auth.ts"
      contains_regex: "jwt\\.verify"
      weight: 0.3

scoring:
  weights:
    verification: 0.70
    efficiency: 0.15
    cost: 0.15
```

## 3. Best Practices for Task Design

1. **Deterministic Verifiers**: Never rely on subjective regexes alone. Use compiler exit codes, unit tests, or SQLite EXPLAIN query plans.
2. **Network Isolation**: By default, keep `network: disabled` to ensure agents cannot game evaluations by fetching answers externally.
3. **Seeded Variations**: Use `kazi-bench generate <task-id> --seed 42` to test tasks with randomized ports, tokens, and identifiers.
4. **Validation**: Always run `kazi-bench validate <path>` to confirm your task matches the Zod schema.
