const assert = require("assert");
const { authenticate } = require("./auth.js");

function createMockRes() {
  return {
    statusCode: 200,
    body: "",
    writeHead(code) {
      this.statusCode = code;
      return this;
    },
    end(data) {
      this.body = data;
    },
  };
}

// Test 1: Missing header must return 401
{
  const req = { headers: {} };
  const res = createMockRes();
  let nextCalled = false;
  authenticate(req, res, () => { nextCalled = true; });

  assert.strictEqual(res.statusCode, 401, "Expected missing header to return 401");
  assert.strictEqual(nextCalled, false, "next() must not be called on missing auth");
}

// Test 2: Invalid token must return 401
{
  const req = { headers: { authorization: "Bearer wrong-token" } };
  const res = createMockRes();
  let nextCalled = false;
  authenticate(req, res, () => { nextCalled = true; });

  assert.strictEqual(res.statusCode, 401, "Expected invalid token to return 401");
  assert.strictEqual(nextCalled, false, "next() must not be called on invalid token");
}

// Test 3: Valid token must pass through
{
  const req = { headers: { authorization: "Bearer secret-benchmark-token" } };
  const res = createMockRes();
  let nextCalled = false;
  authenticate(req, res, () => { nextCalled = true; });

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(nextCalled, true, "next() must be called for valid bearer token");
  assert.strictEqual(req.user.authenticated, true);
}

console.log("All 3 authentication middleware tests PASSED!");
