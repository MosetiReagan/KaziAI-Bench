const assert = require("assert");
const crypto = require("crypto");
const { executeWorkflow } = require("./client.js");

const testData = "kaziai_bench_sample_payload";
const expectedHash = crypto.createHash("sha256").update(testData).digest("hex");

const actualHash = executeWorkflow(testData);
assert.strictEqual(
  actualHash,
  expectedHash,
  `Expected SHA256 '${expectedHash}', but got '${actualHash}'`
);

console.log("All MCP tool selection tests PASSED!");
