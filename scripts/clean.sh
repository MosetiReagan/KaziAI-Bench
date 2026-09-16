#!/usr/bin/env bash
set -e

echo "Cleaning build artifacts and temporary files..."
rm -rf dist build coverage .turbo
find . -name "dist" -type d -prune -exec rm -rf '{}' +
find . -name "*.tsbuildinfo" -type f -delete
find . -name ".sandbox" -type d -prune -exec rm -rf '{}' +
echo "Clean complete."
