## Benchmark Pull Request & Task Submission Checklist

### Type of Change
- [ ] New Benchmark Task Proposal
- [ ] Task Fix / Dependency Drift Patch
- [ ] Core Engine / Sandboxing Improvement
- [ ] SDK / Verifier / Tool Feature
- [ ] Documentation / Baseline Result Submission

---

### If submitting a new Benchmark Task:
- [ ] Task ID follows `<domain>.<task-name>` format
- [ ] Task manifest includes anti-contamination canary GUID (`kazi-canary-*`)
- [ ] Task passes static schema validation (`pnpm bench validate <path>`)
- [ ] Verified with negative No-Op run (fails on untouched fixture)
- [ ] Verified with reference Oracle run (passes with 100% score)
- [ ] Adversarial cheat resistance confirmed via `HackerFixerLoop`
- [ ] Resource quotas set explicitly (`cpu_limit`, `memory_limit_mb`, `max_duration_seconds`)
- [ ] Network constraint set to `disabled` unless explicitly testing public HTTP API

---

### If submitting an evaluation Leaderboard result:
- [ ] Executed minimum 5 trials per task across independent seeds ($N \ge 5$)
- [ ] Full step-by-step trajectory JSON logs included in PR
- [ ] Submitted metadata matches `BenchmarkSubmissionPackageSchema`
