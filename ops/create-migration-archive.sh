#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="${0:A:h}"
PROJECT_ROOT="${PROJECT_ROOT:-${SCRIPT_DIR:h}}"
PROJECT_PARENT="${PROJECT_ROOT:h}"
PROJECT_NAME="${PROJECT_ROOT:t}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUTPUT="${OUTPUT:-$PROJECT_ROOT/sfdw-vending-machine-mac-mini-$STAMP.tar.gz}"

unset LC_ALL
export LANG="${SFDW_LANG:-en_US.UTF-8}"
export LC_CTYPE="${SFDW_LC_CTYPE:-UTF-8}"

cd "$PROJECT_PARENT"

/usr/bin/tar \
  --exclude="$PROJECT_NAME/.git" \
  --exclude="$PROJECT_NAME/.DS_Store" \
  --exclude="$PROJECT_NAME/**/.DS_Store" \
  --exclude="$PROJECT_NAME/service/logs/*" \
  --exclude="$PROJECT_NAME/service/print-jobs/*" \
  --exclude="$PROJECT_NAME/sfdw-vending-machine-mac-mini-*.tar.gz" \
  --exclude="$PROJECT_NAME/sfdw-vending-machine-migration-2026-06-08.tar.gz" \
  -czf "$OUTPUT" \
  "$PROJECT_NAME"

echo "$OUTPUT"
