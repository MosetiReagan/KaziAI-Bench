const assert = require("assert");
const { pingHost } = require("./ping.js");

// Test 1: Valid host succeeds
{
  const res = pingHost("127.0.0.1");
  assert.strictEqual(res.success, true);
}

// Test 2: Injected shell payload must be rejected
{
  const maliciousInput = "127.0.0.1; echo VULNERABILITY_EXPLOITED";
  const res = pingHost(maliciousInput);

  assert.strictEqual(res.success, false, "Malicious shell injection payload must be rejected!");
  assert.strictEqual(
    (res.output || "").includes("VULNERABILITY_EXPLOITED"),
    false,
    "VULNERABILITY_EXPLOITED signature must not appear in output!"
  );
}

console.log("All 2 security command injection tests PASSED!");
