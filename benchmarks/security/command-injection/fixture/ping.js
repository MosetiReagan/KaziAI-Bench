const cp = require("child_process");

// Vulnerable ping wrapper: concatenates input directly into shell execution!
function pingHost(host) {
  // BUG: Vulnerable to command injection (e.g. "127.0.0.1; whoami")
  try {
    const cmd = `echo "pinging ${host}"`;
    const out = cp.execSync(cmd).toString();
    return { success: true, output: out };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { pingHost };
