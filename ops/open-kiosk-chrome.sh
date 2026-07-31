#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="${0:A:h}"
PROJECT_ROOT="${PROJECT_ROOT:-${SCRIPT_DIR:h}}"
KIOSK_URL="${KIOSK_URL:-http://127.0.0.1:4180/?printer=service}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:4180/health}"
CHROME_APP_NAME="${CHROME_APP_NAME:-Google Chrome}"
CHROME_APP_PATH="${CHROME_APP_PATH:-/Applications/Google Chrome.app}"
WAIT_SECONDS="${WAIT_SECONDS:-90}"

for _ in $(seq 1 "$WAIT_SECONDS"); do
  if /usr/bin/curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! /usr/bin/curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
  echo "Service did not become healthy at $HEALTH_URL within ${WAIT_SECONDS}s." >&2
  exit 1
fi

if [[ -d "$CHROME_APP_PATH" ]]; then
  /usr/bin/open -a "$CHROME_APP_NAME" --args \
    --kiosk "$KIOSK_URL" \
    --no-first-run \
    --disable-session-crashed-bubble \
    --disable-translate \
    --autoplay-policy=no-user-gesture-required
else
  echo "Google Chrome was not found at $CHROME_APP_PATH. Opening the URL with the default browser." >&2
  /usr/bin/open "$KIOSK_URL"
fi
