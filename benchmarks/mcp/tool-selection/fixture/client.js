const crypto = require("crypto");
const manifest = require("./mcp_manifest.json");

// Simulated MCP server invocation
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

// BUGGY client workflow: invokes the wrong/deprecated tool
function executeWorkflow(payload) {
  // BUG: Agent needs to fix this to select 'secure_hasher' with { algorithm: 'sha256', data: payload }
  return callMcpTool("legacy_calculator", { input: payload });
}

module.exports = { callMcpTool, executeWorkflow };
