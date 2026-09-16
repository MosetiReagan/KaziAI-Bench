#!/usr/bin/env bash
set -e

# Validate Dockerfile exists
test -f Dockerfile || (echo "FAILED: Dockerfile missing" && exit 1)

# Ensure curl is not used in alpine HEALTHCHECK without package installation
if grep -E "HEALTHCHECK.*curl" Dockerfile > /dev/null; then
  if ! grep -E "apk add.*curl" Dockerfile > /dev/null; then
    echo "FAILED: Dockerfile uses curl in HEALTHCHECK on alpine without installing curl"
    exit 1
  fi
fi

# Ensure valid healthcheck directive exists
grep -E "HEALTHCHECK.*(wget|curl)" Dockerfile > /dev/null || (echo "FAILED: No valid healthcheck found" && exit 1)

echo "DevOps Docker healthcheck test PASSED!"
