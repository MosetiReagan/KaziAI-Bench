# KaziAI Bench Python Client

Official Python SDK for running, evaluating, and recording benchmarks against [KaziAI Bench](https://github.com/kazi-ai/kazi-bench).

## Installation

```bash
pip install kazi-bench
```

## Quickstart

```python
from kazi_bench import KaziBenchClient, TaskResult

client = KaziBenchClient(base_url="http://localhost:4000", api_key="your-api-key")

# List all tasks
tasks = client.list_tasks()
print(f"Available tasks: {len(tasks)}")

# Run an evaluation
run = client.create_run(
    task_id="coding.fix-auth",
    agent_id="my-python-agent",
    model_id="gpt-4o"
)
print(f"Started run: {run.id}")
```
