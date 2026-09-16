"""
KaziAI Bench — Python Client SDK
"""

from typing import Dict, Any, List, Optional
import requests

__version__ = "1.0.0"

class KaziError(Exception):
    """Base error for KaziAI Bench client."""
    pass

class TaskRecord:
    def __init__(self, data: Dict[str, Any]):
        self.id = data.get("id")
        self.name = data.get("name")
        self.category = data.get("category")
        self.difficulty = data.get("difficulty")
        self.description = data.get("description")
        self.timeout_ms = data.get("timeoutMs", 60000)

    def __repr__(self) -> str:
        return f"<TaskRecord id={self.id} category={self.category} difficulty={self.difficulty}>"

class RunRecord:
    def __init__(self, data: Dict[str, Any]):
        self.id = data.get("id")
        self.task_id = data.get("taskId")
        self.agent_id = data.get("agentId")
        self.model_id = data.get("modelId")
        self.status = data.get("status")
        self.success = data.get("success", False)
        self.score = data.get("score", 0.0)
        self.total_steps = data.get("totalSteps", 0)
        self.total_duration_ms = data.get("totalDurationMs", 0)
        self.total_cost_usd = data.get("totalCostUsd", 0.0)
        self.total_tokens = data.get("totalTokens", 0)
        self.seed = data.get("seed")

    def __repr__(self) -> str:
        return f"<RunRecord id={self.id} task={self.task_id} status={self.status} success={self.success}>"

class KaziBenchClient:
    """Client for communicating with KaziAI Bench REST API."""

    def __init__(self, base_url: str = "http://localhost:4000", api_key: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.session = requests.Session()
        if self.api_key:
            self.session.headers.update({
                "Authorization": f"Bearer {self.api_key}",
                "x-api-key": self.api_key,
            })

    def list_tasks(self, category: Optional[str] = None, difficulty: Optional[str] = None) -> List[TaskRecord]:
        """Fetch all available benchmark tasks."""
        params = {}
        if category:
            params["category"] = category
        if difficulty:
            params["difficulty"] = difficulty

        res = self.session.get(f"{self.base_url}/api/v1/tasks", params=params)
        if res.status_code != 200:
            raise KaziError(f"Failed to list tasks: {res.text}")

        data = res.json()
        return [TaskRecord(t) for t in data.get("tasks", [])]

    def get_task(self, task_id: str) -> TaskRecord:
        """Fetch details for a specific benchmark task."""
        res = self.session.get(f"{self.base_url}/api/v1/tasks/{task_id}")
        if res.status_code == 404:
            raise KaziError(f"Task '{task_id}' not found")
        if res.status_code != 200:
            raise KaziError(f"Error fetching task: {res.text}")

        data = res.json()
        return TaskRecord(data.get("task", {}))

    def create_run(
        self,
        task_id: str,
        agent_id: str = "python-client-agent",
        model_id: str = "gpt-4o",
        seed: str = "42"
    ) -> RunRecord:
        """Enqueue and start a benchmark run."""
        payload = {
            "taskId": task_id,
            "agentId": agent_id,
            "modelId": model_id,
            "seed": str(seed),
        }
        res = self.session.post(f"{self.base_url}/api/v1/runs", json=payload)
        if res.status_code not in (200, 201):
            raise KaziError(f"Failed to create run: {res.text}")

        data = res.json()
        return RunRecord(data.get("run", {}))

    def get_run(self, run_id: str) -> RunRecord:
        """Get current status and metrics of a benchmark run."""
        res = self.session.get(f"{self.base_url}/api/v1/runs/{run_id}")
        if res.status_code == 404:
            raise KaziError(f"Run '{run_id}' not found")
        if res.status_code != 200:
            raise KaziError(f"Error fetching run: {res.text}")

        data = res.json()
        return RunRecord(data.get("run", {}))

    def get_leaderboard(self) -> List[Dict[str, Any]]:
        """Fetch current agent reliability leaderboard."""
        res = self.session.get(f"{self.base_url}/api/v1/leaderboard")
        if res.status_code != 200:
            raise KaziError(f"Error fetching leaderboard: {res.text}")
        return res.json().get("leaderboard", [])
