#!/usr/bin/env bash
set -e

echo "=== KaziAI Bench: Environment Setup ==="

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js 20+ is required."
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Installing pnpm via corepack..."
  corepack enable
  corepack prepare pnpm@10.23.0 --activate
fi

if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
fi

echo "Installing monorepo dependencies..."
pnpm install

echo "Building core packages..."
pnpm build

echo "Setup complete! Run 'pnpm doctor' or 'kazi-bench list' to get started."
