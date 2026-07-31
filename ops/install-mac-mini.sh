#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="${0:A:h}"
PROJECT_ROOT="${PROJECT_ROOT:-${SCRIPT_DIR:h}}"
LABEL="com.sfdw.vending-machine"
CHROME_LABEL="com.sfdw.vending-machine.chrome"
PLIST_SOURCE="$PROJECT_ROOT/ops/$LABEL.plist"
PLIST_TARGET="$HOME/Library/LaunchAgents/$LABEL.plist"
CHROME_PLIST_SOURCE="$PROJECT_ROOT/ops/$CHROME_LABEL.plist"
CHROME_PLIST_TARGET="$HOME/Library/LaunchAgents/$CHROME_LABEL.plist"
INSTALL_CHROME=1

for arg in "$@"; do
  case "$arg" in
    --service-only|--no-chrome)
      INSTALL_CHROME=0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Usage: ops/install-mac-mini.sh [--service-only]" >&2
      exit 1
      ;;
  esac
done

find_node() {
  if [[ -n "${NODE_BIN:-}" && -x "$NODE_BIN" ]]; then
    echo "$NODE_BIN"
    return 0
  fi

  local resolved
  resolved="$(command -v node || true)"
  if [[ -n "$resolved" ]]; then
    echo "$resolved"
    return 0
  fi

  for candidate in \
    "/opt/homebrew/bin/node" \
    "/usr/local/bin/node" \
    "/Applications/Codex.app/Contents/Resources/node"; do
    if [[ -x "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done

  return 1
}

NODE_PATH="$(find_node || true)"
if [[ -z "$NODE_PATH" ]]; then
  echo "Node.js was not found. Install Node.js, then rerun this script." >&2
  exit 1
fi

cd "$PROJECT_ROOT"
mkdir -p service/logs "$HOME/Library/LaunchAgents"
chmod +x ops/start-event-service.sh
chmod +x ops/open-kiosk-chrome.sh

"$NODE_PATH" --check webapp/app.js
"$NODE_PATH" --check service/server.mjs
"$NODE_PATH" --check service/receiptFormatter.mjs

cat > "$PLIST_SOURCE" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>

  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>exec "$PROJECT_ROOT/ops/start-event-service.sh"</string>
  </array>

  <key>WorkingDirectory</key>
  <string>$PROJECT_ROOT</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>NODE_BIN</key>
    <string>$NODE_PATH</string>
    <key>PROJECT_ROOT</key>
    <string>$PROJECT_ROOT</string>
  </dict>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <key>StandardOutPath</key>
  <string>$PROJECT_ROOT/service/logs/event-service.log</string>

  <key>StandardErrorPath</key>
  <string>$PROJECT_ROOT/service/logs/event-service.err.log</string>
</dict>
</plist>
PLIST

cp "$PLIST_SOURCE" "$PLIST_TARGET"

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_TARGET"
launchctl enable "gui/$(id -u)/$LABEL"
launchctl kickstart -k "gui/$(id -u)/$LABEL"

if [[ "$INSTALL_CHROME" == "1" ]]; then
  cat > "$CHROME_PLIST_SOURCE" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$CHROME_LABEL</string>

  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>exec "$PROJECT_ROOT/ops/open-kiosk-chrome.sh"</string>
  </array>

  <key>WorkingDirectory</key>
  <string>$PROJECT_ROOT</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>PROJECT_ROOT</key>
    <string>$PROJECT_ROOT</string>
  </dict>

  <key>RunAtLoad</key>
  <true/>

  <key>StandardOutPath</key>
  <string>$PROJECT_ROOT/service/logs/chrome-kiosk.log</string>

  <key>StandardErrorPath</key>
  <string>$PROJECT_ROOT/service/logs/chrome-kiosk.err.log</string>
</dict>
</plist>
PLIST

  cp "$CHROME_PLIST_SOURCE" "$CHROME_PLIST_TARGET"
  launchctl bootout "gui/$(id -u)/$CHROME_LABEL" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$CHROME_PLIST_TARGET"
  launchctl enable "gui/$(id -u)/$CHROME_LABEL"
  launchctl kickstart -k "gui/$(id -u)/$CHROME_LABEL"
fi

echo "Installed $LABEL"
if [[ "$INSTALL_CHROME" == "1" ]]; then
  echo "Installed $CHROME_LABEL"
fi
echo "Project: $PROJECT_ROOT"
echo "Node: $NODE_PATH"
echo
if lpstat -p SFDW_POS58 >/dev/null 2>&1; then
  echo "Printer queue SFDW_POS58 exists."
else
  echo "Printer queue SFDW_POS58 was not found. Create it before production printing."
fi
echo
echo "Verify service:"
echo "  curl http://127.0.0.1:4180/health"
echo
echo "Open production:"
echo "  http://127.0.0.1:4180/production.html"
echo "  ops/open-kiosk-chrome.sh"
echo
echo "Verify printer queue before production printing:"
echo "  lpstat -p SFDW_POS58"
echo "  lpstat -v SFDW_POS58"
