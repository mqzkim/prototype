#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "$CLAUDE_PROJECT_DIR/node_modules" ]; then
  cd "$CLAUDE_PROJECT_DIR"
  npm install
fi

# Build the site
cd "$CLAUDE_PROJECT_DIR"
npm run build

# Verify everything works
npm test
