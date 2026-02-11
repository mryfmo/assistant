#!/usr/bin/env bash
set -euo pipefail

# Install project templates into the current git repo root.
# Usage: ./install_project.sh
#
# It will:
# - Copy starter-project/* into repo root
# - Create backups with .bak timestamp suffix for conflicting files

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${ROOT}" ]]; then
  echo "Error: not inside a git repository."
  exit 1
fi

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../starter-project" && pwd)"
TS="$(date +%Y%m%d_%H%M%S)"

echo "Repo root: ${ROOT}"
echo "Source:    ${SRC_DIR}"

copy_with_backup() {
  local src="$1"
  local dst="$2"

  if [[ -e "${dst}" ]]; then
    local bak="${dst}.bak.${TS}"
    echo "Backup: ${dst} -> ${bak}"
    cp -a "${dst}" "${bak}"
  fi

  mkdir -p "$(dirname "${dst}")"
  cp -a "${src}" "${dst}"
}

# Copy top-level files
copy_with_backup "${SRC_DIR}/AGENTS.md" "${ROOT}/AGENTS.md"
copy_with_backup "${SRC_DIR}/opencode.jsonc" "${ROOT}/opencode.jsonc"

# Copy .opencode directory
mkdir -p "${ROOT}/.opencode"
# Use rsync if available for merges; fallback to cp
if command -v rsync >/dev/null 2>&1; then
  rsync -a "${SRC_DIR}/.opencode/" "${ROOT}/.opencode/"
else
  cp -a "${SRC_DIR}/.opencode/." "${ROOT}/.opencode/"
fi

echo "Done."
echo "Next: Review/merge changes and commit AGENTS.md / .opencode/ as needed."
