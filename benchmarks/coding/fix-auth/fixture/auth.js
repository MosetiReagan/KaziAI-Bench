// Buggy auth middleware: passes through requests without authentication
function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];

  // BUG: missing validation, erroneously calls next() even if header is missing or invalid
  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return next();
  }

  const token = parts[1];
  if (token !== "secret-benchmark-token") {
    // BUG: does not reject invalid token!
    return next();
  }

  req.user = { authenticated: true };
  next();
}

module.exports = { authenticate };
