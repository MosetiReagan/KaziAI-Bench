// Buggy pagination helper
function paginate(items, page, limit) {
  // BUG: doesn't handle non-positive page or limit, and off-by-one in startIndex
  const startIndex = page * limit; // Bug: page 1 should start at 0, not 1*limit!
  const endIndex = startIndex + limit;

  return {
    items: items.slice(startIndex, endIndex),
    page,
    limit,
    total: items.length,
    totalPages: Math.floor(items.length / limit), // Bug: should be Math.ceil
  };
}

module.exports = { paginate };
