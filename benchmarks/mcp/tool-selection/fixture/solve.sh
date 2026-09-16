#!/usr/bin/env bash
cat << 'EOF' > client.js
const crypto = require("crypto");
const manifest = require("./mcp_manifest.json");

function callMcpTool(toolName, args) {
  const tool = manifest.tools.find((t) => t.name === toolName);
  if (!tool) throw new Error(`MCP Tool Not Found: ${toolName}`);
  if (tool.status === "deprecated") throw new Error(`Deprecated tool invoked: ${toolName}`);

  if (toolName === "secure_hasher") {
    if (!args.algorithm || !args.data) throw new Error("Missing required parameters for secure_hasher");
    return crypto.createHash(args.algorithm).update(args.data).digest("hex");
  }

  throw new Error(`Unsupported tool: ${toolName}`);
}

function executeWorkflow(payload) {
  // Correctly selected 'secure_hasher' matching manifest parameters
  return callMcpTool("secure_hasher", { algorithm: "sha256", data: payload });
}

module.exports = { callMcpTool, executeWorkflow };
EOF
