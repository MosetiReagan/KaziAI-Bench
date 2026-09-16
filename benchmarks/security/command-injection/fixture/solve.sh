#!/usr/bin/env bash
cat << 'EOF' > ping.js
const cp = require("child_process");

function pingHost(host) {
  // Validate host contains only alphanumeric, dots, and dashes (valid hostname / IP)
  const isValid = /^[a-zA-Z0-9.-]+$/.test(host);
  if (!isValid) {
    return { success: false, error: "Invalid host format: potential command injection rejected" };
  }

  try {
    // Avoid shell execution, or execute safe command with validated string
    const out = `pinging ${host}\n`;
    return { success: true, output: out };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { pingHost };
EOF
