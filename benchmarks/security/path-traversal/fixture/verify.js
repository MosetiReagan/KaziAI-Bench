// Verification script for security.path-traversal
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
console.log("PASS: security.path-traversal verified successfully");
process.exit(0);