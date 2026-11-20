#!/usr/bin/env bash
set -Eeuo pipefail

APP_NAME="omcp-panel"
INSTALL_DIR="/opt/omcp-panel"
APP_DIR="${INSTALL_DIR}/app"
SERVICE_NAME="omcp-panel"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
PORT="${OMCP_PORT:-6767}"
REPO_URL="https://github.com/notmronionji/ONION-OMCP.git"

say() { printf '\033[1;32m[OMCP]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[OMCP]\033[0m %s\n' "$*" >&2; }
fail() { printf '\033[1;31m[OMCP ERROR]\033[0m %s\n' "$*" >&2; exit 1; }
need_root() { [[ "${EUID}" -eq 0 ]] || fail "Run as root: sudo bash install.sh"; }
need_debian() { [[ -r /etc/os-release ]] || fail "Cannot identify Linux distribution."; . /etc/os-release; [[ "${ID}" == "ubuntu" || "${ID}" == "debian" || "${ID_LIKE:-}" == *debian* ]] || fail "This preview installer supports Debian/Ubuntu only."; }
ensure_node() {
  if command -v node >/dev/null 2>&1 && [[ "$(node -p 'Number(process.versions.node.split(".")[0])')" -ge 20 ]]; then
    say "Using Node.js $(node --version)"
    return
  fi
  say "Installing Node.js 20 from NodeSource"
  apt-get update
  apt-get install -y ca-certificates curl git
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  [[ "$(node -p 'Number(process.versions.node.split(".")[0])')" -ge 20 ]] || fail "Node.js 20+ is required."
}
prepare_source() {
  if [[ ! -f "${APP_DIR}/package.json" ]]; then
    mkdir -p "${INSTALL_DIR}"
    git clone --depth 1 "${REPO_URL}" "${APP_DIR}"
  fi
}
write_service() {
  cat > "${SERVICE_FILE}" <<UNIT
[Unit]
Description=OMCP Panel (frontend preview)
After=network.target

[Service]
Type=simple
User=omcp
Group=omcp
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run preview -- --host 127.0.0.1 --port ${PORT}
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=${APP_DIR}

[Install]
WantedBy=multi-user.target
UNIT
  systemctl daemon-reload
  systemctl enable "${SERVICE_NAME}"
}
build_app() {
  cd "${APP_DIR}"
  npm install
  npm run build
  id omcp >/dev/null 2>&1 || useradd --system --home "${INSTALL_DIR}" --shell /usr/sbin/nologin omcp
  chown -R omcp:omcp "${INSTALL_DIR}"
  write_service
  systemctl restart "${SERVICE_NAME}"
}
install_panel() {
  need_root; need_debian
  apt-get update
  apt-get install -y ca-certificates curl git
  ensure_node
  prepare_source
  build_app
  say "OMCP Panel preview installed."
  say "Preview listens on: http://127.0.0.1:${PORT} (localhost only)"
  warn "This is a frontend preview only. API, Connector, Minecraft provisioning and TCP routing are not implemented yet."
}
update_panel() {
  need_root; prepare_source; ensure_node
  cd "${APP_DIR}"
  git pull --ff-only origin main
  build_app
  say "OMCP Panel preview updated."
}
repair_panel() {
  need_root; prepare_source; ensure_node
  build_app
  say "OMCP Panel preview rebuilt and service restarted."
}
uninstall_panel() {
  need_root
  read -r -p "Remove OMCP Panel preview and its application files? [y/N] " answer
  [[ "${answer}" == "y" || "${answer}" == "Y" ]] || { say "Cancelled."; return; }
  systemctl disable --now "${SERVICE_NAME}" 2>/dev/null || true
  rm -f "${SERVICE_FILE}"
  systemctl daemon-reload
  rm -rf "${INSTALL_DIR}"
  say "OMCP Panel preview removed. Node.js and system packages were left installed."
}
menu() {
  printf '\n  OMCP PANEL MANAGER\n  1) Install preview\n  2) Update\n  3) Repair / rebuild\n  4) Uninstall\n  5) Exit\n\n'
  read -r -p "Select an option: " choice
  case "${choice}" in
    1) install_panel ;;
    2) update_panel ;;
    3) repair_panel ;;
    4) uninstall_panel ;;
    5) exit 0 ;;
    *) fail "Invalid selection." ;;
  esac
}
case "${1:-menu}" in
  install) install_panel ;;
  update) update_panel ;;
  repair) repair_panel ;;
  uninstall) uninstall_panel ;;
  menu|"")
    if [[ -t 0 ]]; then
      menu
    else
      say "Non-interactive install detected; starting installation."
      install_panel
    fi
    ;;
  *) fail "Usage: sudo bash install.sh [install|update|repair|uninstall]" ;;
esac
