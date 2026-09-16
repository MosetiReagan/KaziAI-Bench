#!/usr/bin/env bash
cat << 'EOF' > auth.js
function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.writeHead(401).end("Unauthorized: Missing authorization header");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.writeHead(401).end("Unauthorized: Malformed authorization header");
  }

  const token = parts[1];
  if (token !== "secret-benchmark-token") {
    return res.writeHead(401).end("Unauthorized: Invalid bearer token");
  }

  req.user = { authenticated: true };
  next();
}

module.exports = { authenticate };
EOF
