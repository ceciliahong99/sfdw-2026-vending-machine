#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="${0:A:h}"
PROJECT_ROOT="${PROJECT_ROOT:-${SCRIPT_DIR:h}}"

if [[ -n "${NODE_BIN:-}" && -x "$NODE_BIN" ]]; then
  RESOLVED_NODE="$NODE_BIN"
else
  RESOLVED_NODE="$(command -v node || true)"

  if [[ -z "$RESOLVED_NODE" ]]; then
    for candidate in \
      "/opt/homebrew/bin/node" \
      "/usr/local/bin/node" \
      "/Applications/Codex.app/Contents/Resources/node"; do
      if [[ -x "$candidate" ]]; then
        RESOLVED_NODE="$candidate"
        break
      fi
    done
  fi
fi

if [[ -z "$RESOLVED_NODE" ]]; then
  echo "Unable to find node. Install Node.js or set NODE_BIN=/path/to/node." >&2
  exit 1
fi

cd "$PROJECT_ROOT"
mkdir -p service/logs

exec /usr/bin/caffeinate -dimsu /usr/bin/env \
  PORT=4180 \
  PRINTER_MODE=lp \
  PRINTER_QUEUE=SFDW_POS58 \
  PRINT_PROFILE_IMAGES=1 \
  PRINT_COOLDOWN_MS=20000 \
  "$RESOLVED_NODE" service/server.mjs
