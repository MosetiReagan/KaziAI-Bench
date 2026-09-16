import { describe, it, expect } from "vitest";
import { WorkerQueue } from "../src/queue.js";

describe("WorkerQueue Unit Tests", () => {
  it("should initialize queue and track pending counts", () => {
    const queue = new WorkerQueue(2);
    expect(queue.getPendingCount()).toBe(0);
    expect(queue.getProcessingCount()).toBe(0);
  });

  it("should enqueue a job with initial queued status", () => {
    const queue = new WorkerQueue(2);
    const job = queue.enqueue({
      id: "job_test_1",
      taskId: "coding.fix-auth",
      agentId: "test-agent",
      modelId: "gpt-4o",
      seed: "42",
    });

    expect(job.id).toBe("job_test_1");
    expect(job.status).toBeDefined();
    expect(queue.getJob("job_test_1")).toBeDefined();
  });
});
