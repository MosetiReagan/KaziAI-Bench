const assert = require("assert");
const { handleWebhook, getProcessedCount, resetCount } = require("./receiver.js");

resetCount();

// Delivery 1: Event evt_123
const res1 = handleWebhook({ id: "evt_123", type: "charge.success", amount: 5000 });
assert.strictEqual(res1.statusCode, 200);

// Delivery 2: Retried duplicate of evt_123 (network retry)
const res2 = handleWebhook({ id: "evt_123", type: "charge.success", amount: 5000 });
assert.strictEqual(res2.statusCode, 200);

// Crucial assertion: Event logic must execute exactly ONCE
const executions = getProcessedCount();
assert.strictEqual(
  executions,
  1,
  `Expected exactly 1 execution for duplicate event delivery, but executed ${executions} times!`
);

// Delivery 3: Distinct event evt_456
const res3 = handleWebhook({ id: "evt_456", type: "charge.success", amount: 2000 });
assert.strictEqual(res3.statusCode, 200);
assert.strictEqual(getProcessedCount(), 2, "New event ID should increment execution count to 2");

console.log("All webhook idempotency tests PASSED!");
