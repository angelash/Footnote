#!/usr/bin/env bash
set -euo pipefail

# WSL Cursor Runner service launcher (for PM2).
export HOST="${HOST:-127.0.0.1}"
export PORT="${PORT:-3210}"

exec node tools/n8n/wsl-runner/server.mjs


