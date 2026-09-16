# Contributing to KaziAI Bench

Thank you for your interest in contributing to **KaziAI Bench**!

KaziAI Bench is an open-source evaluation platform measuring the reliability, autonomous recovery, and safety of AI agents operating in realistic, multi-step environments.

---

## 1. Task Authoring Quickstart (Step-by-Step)

Contributing a new benchmark task to KaziAI Bench follows a rigorous, reproducible workflow modeled after research standards:

### Step 1: Choose Domain & Unique Task ID
Select one of the 8 core domains: `coding`, `debugging`, `database`, `security`, `terminal`, `devops`, `api`, or `mcp`. Your task ID must follow `<domain>.<task-name>` (e.g. `database.connection-pool-exhaustion`).

### Step 2: Scaffold Task Files
Create directory `benchmarks/<domain>/<task-name>/` containing:
```
benchmarks/<domain>/<task-name>/
├── task.yaml          # Task definition, constraints, and verifier config
└── fixture/           # Broken starting environment
    ├── problem.md     # Clear instructions provided to the agent
    └── verify.js      # Deterministic verifier script (exit 0 on pass, exit 1 on fail)
```

### Step 3: Embed an Anti-Contamination Canary
Add a unique canary tag to prevent pre-training contamination:
```yaml
tags:
  - "kazi-canary-a1b2c3d4"
```

### Step 4: Run the Automated Task Rubric & Invariant Tests
Your task must pass both:
1. **The Negative No-Op Baseline**: Clean untouched fixture must FAIL verification.
2. **The Reference Oracle Pass**: Applying the correct fix must PASS verification with a 100% score.
3. **Static Schema Validation**:
   ```bash
   pnpm bench validate benchmarks/<domain>/<task-name>
   ```

---

## 2. External Submission Requirements for the Leaderboard

To ensure evaluation integrity and research credibility, all external benchmark submissions must meet the following three non-negotiable criteria:

1. **Minimum 5 Trials per Task ($N \ge 5$)**: Single runs are not accepted. Each task must be evaluated across 5 independent seeds to establish statistical significance and variance ($\sigma$).
2. **Mandatory Step-by-Step Trajectory Logs**: Submissions must include full trajectory JSON files recording all thoughts, tool invocations, and stdout/stderr outputs. Maintainers audit trajectories for verifier bypasses.
3. **Strict Compliance with `BenchmarkSubmissionPackage` Schema**: Submissions must include agent metadata, foundation model provider, temperature, and token costs.

Submit results by opening a PR containing your submission JSON or using the Python SDK:
```python
client.submit_package(my_submission_dict)
```

---

## 3. Local Development Workflow

```bash
# Clone the repository
git clone https://github.com/MosetiReagan/KaziAI-Bench.git
cd KaziAI-Bench

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run unit and integration tests
pnpm test

# Run environment doctor
pnpm bench doctor
```

Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) standard (`feat(...)`, `fix(...)`, `test(...)`, `docs(...)`).
