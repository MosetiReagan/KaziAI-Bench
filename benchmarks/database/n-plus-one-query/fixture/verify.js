// Verification script for database.n-plus-one-query
const fs = require("fs");
if (!fs.existsSync("solution.txt")) {
  console.error("FAIL: solution.txt not found");
  process.exit(1);
}
const content = fs.readFileSync("solution.txt", "utf-8").trim();
if (!content.includes("SOLVED")) {
  console.error("FAIL: Expected SOLVED in solution.txt");
  process.exit(1);
}
console.log("PASS: database.n-plus-one-query verified successfully");
process.exit(0);