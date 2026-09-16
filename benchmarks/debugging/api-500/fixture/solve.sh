#!/usr/bin/env bash
cat << 'EOF' > handler.js
function handleRequest(body) {
  try {
    const payload = JSON.parse(body);
    const name = payload?.user?.profile?.name || "Guest";
    const displayName = name.toUpperCase();
    return { status: 200, data: { welcome: `Hello, ${displayName}!` } };
  } catch (err) {
    if (err instanceof SyntaxError) {
      return { status: 400, error: "Invalid JSON" };
    }
    return { status: 500, error: `Internal Server Error: ${err.message}` };
  }
}

module.exports = { handleRequest };
EOF
