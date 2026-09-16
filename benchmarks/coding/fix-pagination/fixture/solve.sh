#!/usr/bin/env bash
cat << 'EOF' > paginate.js
function paginate(items, page = 1, limit = 10) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, parseInt(limit, 10) || 10);

  const startIndex = (safePage - 1) * safeLimit;
  const endIndex = startIndex + safeLimit;

  return {
    items: items.slice(startIndex, endIndex),
    page: safePage,
    limit: safeLimit,
    total: items.length,
    totalPages: Math.ceil(items.length / safeLimit),
  };
}

module.exports = { paginate };
EOF
