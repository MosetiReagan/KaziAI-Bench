import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  TrajectoryRecorder,
  SecretRedactor,
  TrajectoryStorage,
  TelemetryCollector,
} from "../src/index.js";

describe("@kazi-ai/tracing", () => {
  it("should record trajectory events and finalize run metrics", () => {
    const recorder = new TrajectoryRecorder({
      runId: "run_test_123",
      taskId: "coding.fix-auth",
      agentId: "test-agent",
      modelId: "gpt-4o",
      seed: 42,
    });

    recorder.recordEvent("TASK_START", { stepIndex: 1, durationMs: 5 });
    recorder.recordEvent("TOOL_CALL", {
      stepIndex: 2,
      tool: "terminal",
      input: { command: "ls" },
      output: "package.json",
      tokens: { inputTokens: 100, outputTokens: 20, totalTokens: 120 },
      durationMs: 50,
    });

    const trajectory = recorder.finalize();
    expect(trajectory.runId).toBe("run_test_123");
    expect(trajectory.events.length).toBe(2);
    expect(trajectory.totalToolCalls).toBe(1);
    expect(trajectory.totalTokens.totalTokens).toBe(120);
  });

  it("should redact API keys and sensitive tokens", () => {
    const redactor = new SecretRedactor();
    const rawText = "Connecting with key sk-abcdef1234567890abcdef1234 and Bearer mytoken123";
    const clean = redactor.redactString(rawText);

    expect(clean).not.toContain("sk-abcdef1234567890abcdef1234");
    expect(clean).toContain("[REDACTED_API_KEY]");

    const rawObj = {
      username: "alice",
      password: "super_secret_pw",
      apiKey: "sk-abcdef1234567890abcdef1234",
    };

    const cleanObj = redactor.redactObject(rawObj);
    expect(cleanObj.password).toBe("[REDACTED_SECRET]");
    expect(cleanObj.apiKey).toBe("[REDACTED_SECRET]");
    expect(cleanObj.username).toBe("alice");
  });

  it("should persist and load trajectories in JSON and JSONL formats", () => {
    const recorder = new TrajectoryRecorder({
      runId: "run_persist_1",
      taskId: "coding.fix-auth",
      agentId: "agent-a",
      modelId: "gpt-4o",
      seed: 1,
    });
    recorder.recordEvent("TASK_START", { stepIndex: 1 });
    const traj = recorder.finalize();

    const tmpJson = path.resolve(process.cwd(), ".sandbox/test_traj.json");
    const tmpJsonl = path.resolve(process.cwd(), ".sandbox/test_traj.jsonl");

    const storage = new TrajectoryStorage();
    storage.saveJson(tmpJson, traj);
    storage.saveJsonl(tmpJsonl, traj);

    const loadedJson = storage.loadJson(tmpJson);
    expect(loadedJson.runId).toBe("run_persist_1");

    const loadedEvents = storage.loadJsonlEvents(tmpJsonl);
    expect(loadedEvents.length).toBe(1);

    if (fs.existsSync(tmpJson)) fs.unlinkSync(tmpJson);
    if (fs.existsSync(tmpJsonl)) fs.unlinkSync(tmpJsonl);
  });

  it("should track Prometheus metrics and spans via TelemetryCollector", () => {
    const tele = TelemetryCollector.getInstance();
    tele.incrementCounter("benchmark_runs_total", 1);
    tele.incrementCounter("agent_tool_calls_total", 3);

    const prom = tele.getPrometheusMetrics();
    expect(prom).toContain("benchmark_runs_total 1");
    expect(prom).toContain("agent_tool_calls_total 3");
  });
});
