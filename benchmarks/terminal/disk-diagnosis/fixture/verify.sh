#!/usr/bin/env bash
set -e

# 1. Active app.log must still exist
test -f logs/app.log || (echo "FAILED: logs/app.log missing" && exit 1)

# 2. debug.dump must be gone
test ! -f logs/debug.dump || (echo "FAILED: logs/debug.dump still present" && exit 1)

# 3. Rotated log dumps must be gone
test ! -f logs/app.log.1 || (echo "FAILED: logs/app.log.1 still present" && exit 1)

echo "Disk diagnosis and cleanup verification PASSED!"
