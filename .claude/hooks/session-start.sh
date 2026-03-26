#!/bin/bash
# Session Start Hook for Claude Code Cloud
# This runs automatically when a new Claude Code session starts.
# Ensures the project is ready to use without any local setup.

set -e

echo "==> Bootstrapping prototype-daily-service..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "==> Installing dependencies..."
  npm install
fi

# Build the site
echo "==> Building site..."
npm run build

echo "==> Bootstrap complete. Ready to develop!"
echo "==> Run 'npm test' to verify, 'npm run daily' to test daily update."
