const assert = require("assert");
const { paginate } = require("./paginate.js");

const dataset = Array.from({ length: 25 }, (_, i) => `item_${i + 1}`);

// Test 1: Page 1 with limit 10 returns first 10 items
{
  const res = paginate(dataset, 1, 10);
  assert.strictEqual(res.items.length, 10);
  assert.strictEqual(res.items[0], "item_1");
  assert.strictEqual(res.items[9], "item_10");
  assert.strictEqual(res.totalPages, 3);
}

// Test 2: Last page (page 3) returns remaining 5 items
{
  const res = paginate(dataset, 3, 10);
  assert.strictEqual(res.items.length, 5);
  assert.strictEqual(res.items[0], "item_21");
  assert.strictEqual(res.items[4], "item_25");
}

// Test 3: Page out of bounds returns empty items array
{
  const res = paginate(dataset, 4, 10);
  assert.strictEqual(res.items.length, 0);
}

// Test 4: Handles default or invalid page/limit cleanly
{
  const res = paginate(dataset, 0, 0);
  assert.strictEqual(res.page >= 1, true);
  assert.strictEqual(res.limit >= 1, true);
}

console.log("All 4 pagination tests PASSED!");
