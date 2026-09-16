const assert = require("assert");
const { handleRequest } = require("./handler.js");

// Case 1: Complete user payload
{
  const res = handleRequest(JSON.stringify({ user: { profile: { name: "Alice" } } }));
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.welcome, "Hello, ALICE!");
}

// Case 2: Missing profile object (previously triggered 500 error)
{
  const res = handleRequest(JSON.stringify({ user: {} }));
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.welcome, "Hello, GUEST!");
}

// Case 3: Missing user object completely
{
  const res = handleRequest(JSON.stringify({}));
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.welcome, "Hello, GUEST!");
}

// Case 4: Invalid JSON
{
  const res = handleRequest("not-json");
  assert.strictEqual(res.status, 400);
}

console.log("All 4 API-500 debugging tests PASSED!");
