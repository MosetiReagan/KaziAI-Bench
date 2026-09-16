// Buggy handler that throws TypeError 500 when profile is null/undefined
function handleRequest(body) {
  try {
    const payload = JSON.parse(body);
    // BUG: Unsafe property access on potentially undefined nested object
    const displayName = payload.user.profile.name.toUpperCase();
    return { status: 200, data: { welcome: `Hello, ${displayName}!` } };
  } catch (err) {
    if (err instanceof SyntaxError) {
      return { status: 400, error: "Invalid JSON" };
    }
    // Propagating unhandled 500
    return { status: 500, error: `Internal Server Error: ${err.message}` };
  }
}

module.exports = { handleRequest };
