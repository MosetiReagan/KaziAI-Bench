const assert = require("assert");
const { QueueWorker } = require("./worker.js");

async function runTests() {
  const worker = new QueueWorker();

  // Job 1: Successful job
  worker.addJob("job-1", async () => "ok");
  const res1 = await worker.processJob("job-1");
  assert.strictEqual(res1.status, "completed");
  assert.strictEqual(res1.result, "ok");

  // Job 2: Failing job (must NOT crash the worker, must mark job status as 'failed')
  worker.addJob("job-2", async () => { throw new Error("Simulated downstream timeout"); });
  const res2 = await worker.processJob("job-2");
  assert.strictEqual(res2.status, "failed");
  assert.strictEqual(typeof res2.error, "string");
  assert.strictEqual(res2.error.includes("Simulated downstream timeout"), true);

  console.log("All 2 worker failure recovery tests PASSED!");
}

runTests();
