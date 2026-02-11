#!/usr/bin/env bash
set -euo pipefail

# Install global templates into ~/.config/opencode
# Usage: ./install_global.sh
#
# It will create backups for existing files.

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../starter-global" && pwd)"
DST_DIR="${HOME}/.config/opencode"
TS="$(date +%Y%m%d_%H%M%S)"

mkdir -p "${DST_DIR}"

copy_with_backup() {
  local src="$1"
  local dst="$2"

  if [[ -e "${dst}" ]]; then
    local bak="${dst}.bak.${TS}"
    echo "Backup: ${dst} -> ${bak}"
    cp -a "${dst}" "${bak}"
  fi

  cp -a "${src}" "${dst}"
}

copy_with_backup "${SRC_DIR}/opencode.jsonc" "${DST_DIR}/opencode.jsonc"
copy_with_backup "${SRC_DIR}/opencode-mem.jsonc" "${DST_DIR}/opencode-mem.jsonc"
copy_with_backup "${SRC_DIR}/AGENTS.md" "${DST_DIR}/AGENTS.md"

echo "Done."
echo "Next: edit ${DST_DIR}/opencode.jsonc and merge with your existing config if needed."
