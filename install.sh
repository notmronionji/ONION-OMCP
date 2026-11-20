#!/usr/bin/env bash
set -Eeuo pipefail

APP_NAME="omcp-panel"
INSTALL_DIR="/opt/omcp-panel"
APP_DIR="${INSTALL_DIR}/app"
SERVICE_NAME="omcp-panel"
GATEWAY_SERVICE="omcp-gateway"
TUNNEL_SERVICE="omcp-cloudflared"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
GATEWAY_FILE="/etc/systemd/system/${GATEWAY_SERVICE}.service"
TUNNEL_FILE="/etc/systemd/system/${TUNNEL_SERVICE}.service"
ENV_FILE="/etc/omcp-panel.env"
MODE_FILE="${INSTALL_DIR}/network-mode"
PID_DIR="${INSTALL_DIR}/run"
LOG_DIR="${INSTALL_DIR}/logs"
PORT="${OMCP_PORT:-6767}"
GATEWAY_PORT="${OMCP_GATEWAY_PORT:-6768}"
REPO_URL="https://github.com/notmronionji/ONION-OMCP.git"

say() { printf '\033[1;32m[OMCP]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[OMCP]\033[0m %s\n' "$*" >&2; }
has_systemd() { [[ -d /run/systemd/system ]] && command -v systemctl >/dev/null 2>&1; }
fail() { printf '\033[1;31m[OMCP ERROR]\033[0m %s\n' "$*" >&2; exit 1; }
need_root() { [[ "${EUID}" -eq 0 ]] || fail "Run as root: sudo bash install.sh"; }
need_debian() {
  [[ -r /etc/os-release ]] || fail "Cannot identify Linux distribution."
  . /etc/os-release
  [[ "${ID}" == "ubuntu" || "${ID}" == "debian" || "${ID_LIKE:-}" == *debian* ]] || fail "This installer supports Debian/Ubuntu only."
}
ensure_node() {
  if command -v node >/dev/null 2>&1 && [[ "$(node -p 'Number(process.versions.node.split(".")[0])')" -ge 20 ]]; then
    say "Using Node.js $(node --version)"
    return
  fi
  say "Installing Node.js 20"
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
write_panel_service() {
  cat > "${SERVICE_FILE}" <<UNIT
[Unit]
Description=OMCP Panel frontend
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
  if has_systemd; then systemctl enable "${SERVICE_NAME}"; fi
}
write_gateway_service() {
  cat > "${GATEWAY_FILE}" <<UNIT
[Unit]
Description=OMCP authenticated access gateway
After=network.target ${SERVICE_NAME}.service
Requires=${SERVICE_NAME}.service

[Service]
Type=simple
User=omcp
Group=omcp
WorkingDirectory=${APP_DIR}
EnvironmentFile=${ENV_FILE}
ExecStart=/usr/bin/node ${APP_DIR}/gateway.mjs
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
UNIT
  if has_systemd; then systemctl enable "${GATEWAY_SERVICE}"; fi
}
install_cloudflared() {
  local arch asset
  arch="$(dpkg --print-architecture)"
  case "$arch" in
    amd64) asset="cloudflared-linux-amd64" ;;
    arm64) asset="cloudflared-linux-arm64" ;;
    armhf) asset="cloudflared-linux-arm" ;;
    *) fail "Cloudflare Tunnel does not have a configured binary for architecture: $arch" ;;
  esac
  say "Installing free Cloudflare Quick Tunnel client"
  curl -fL --retry 3 "https://github.com/cloudflare/cloudflared/releases/latest/download/${asset}" -o /usr/local/bin/cloudflared
  chmod 0755 /usr/local/bin/cloudflared
  /usr/local/bin/cloudflared --version
}
write_tunnel_service() {
  cat > "${TUNNEL_FILE}" <<UNIT
[Unit]
Description=OMCP free Cloudflare Quick Tunnel
Wants=network-online.target
After=network-online.target ${GATEWAY_SERVICE}.service

[Service]
Type=simple
User=omcp
Group=omcp
ExecStart=/usr/local/bin/cloudflared tunnel --no-autoupdate --url http://127.0.0.1:${GATEWAY_PORT}
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
UNIT
  if has_systemd; then systemctl enable "${TUNNEL_SERVICE}"; fi
}
load_gateway_env() {
  set -a
  # This file is created by the root-owned installer and contains only OMCP_* assignments.
  . "${ENV_FILE}"
  set +a
}
start_background() {
  local name="$1"; shift
  mkdir -p "${PID_DIR}" "${LOG_DIR}"
  local pidfile="${PID_DIR}/${name}.pid"
  if [[ -f "$pidfile" ]] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    kill "$(cat "$pidfile")" 2>/dev/null || true
    sleep 1
  fi
  nohup "$@" </dev/null >> "${LOG_DIR}/${name}.log" 2>&1 &
  echo $! > "$pidfile"
  sleep 1
  if ! kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    warn "${name} did not stay running; inspect ${LOG_DIR}/${name}.log"
    return 1
  fi
  say "Started ${name} (PID $(cat "$pidfile"))"
}
stop_background() {
  local name="$1" pidfile="${PID_DIR}/$1.pid"
  if [[ -f "$pidfile" ]]; then
    local pid
    pid="$(cat "$pidfile")"
    kill "$pid" 2>/dev/null || true
    rm -f "$pidfile"
  fi
}
configure_access() {
  local mode="${1:-}"
  [[ "$mode" == "ipv4" || "$mode" == "non-ipv4" ]] || fail "Choose install mode: ipv4 or non-ipv4"
  mkdir -p "${INSTALL_DIR}"
  if [[ ! -s "${ENV_FILE}" ]]; then
    local secret
    secret="$(openssl rand -hex 24)"
    umask 077
    printf 'OMCP_GATEWAY_HOST=127.0.0.1\nOMCP_GATEWAY_PORT=%s\nOMCP_USERNAME=admin\nOMCP_PASSWORD=%s\n' "${GATEWAY_PORT}" "$secret" > "${ENV_FILE}"
  fi
  if [[ "$mode" == "ipv4" ]]; then
    sed -i 's/^OMCP_GATEWAY_HOST=.*/OMCP_GATEWAY_HOST=0.0.0.0/' "${ENV_FILE}"
    rm -f "${TUNNEL_FILE}"
    if has_systemd; then systemctl disable --now "${TUNNEL_SERVICE}" 2>/dev/null || true; else stop_background tunnel; fi
    rm -f "${MODE_FILE}"
    printf 'ipv4\n' > "${MODE_FILE}"
  else
    sed -i 's/^OMCP_GATEWAY_HOST=.*/OMCP_GATEWAY_HOST=127.0.0.1/' "${ENV_FILE}"
    printf 'non-ipv4\n' > "${MODE_FILE}"
    install_cloudflared
    write_tunnel_service
  fi
  chown root:omcp "${ENV_FILE}"
  chmod 0640 "${ENV_FILE}"
}
show_access() {
  local mode public_ip credentials password
  mode="$(cat "${MODE_FILE}" 2>/dev/null || echo ipv4)"
  credentials="$(sed -n 's/^OMCP_USERNAME=//p' "${ENV_FILE}")"
  password="$(sed -n 's/^OMCP_PASSWORD=//p' "${ENV_FILE}")"
  say "Panel login username: ${credentials:-admin}"
  say "Panel login password: ${password}"
  say "Credentials are also stored in ${ENV_FILE}; keep them private."
  if [[ "$mode" == "ipv4" ]]; then
    public_ip="$(curl -4fsS --max-time 8 https://api.ipify.org 2>/dev/null || true)"
    if [[ -n "$public_ip" ]]; then
      say "Panel link: http://${public_ip}:${GATEWAY_PORT}"
      warn "Allow TCP port ${GATEWAY_PORT} in your VPS/provider firewall. Keep the generated login password private."
    else
      warn "Could not detect a public IPv4. Check your provider networking, then open http://YOUR_PUBLIC_IPV4:${GATEWAY_PORT}"
    fi
  else
    if has_systemd; then
      systemctl restart "${TUNNEL_SERVICE}"
      local tunnel_log
      tunnel_log="$(journalctl -u "${TUNNEL_SERVICE}" --no-pager -n 100 2>/dev/null || true)"
    else
      start_background tunnel runuser -u omcp -- /usr/local/bin/cloudflared tunnel --no-autoupdate --url "http://127.0.0.1:${GATEWAY_PORT}"
      local tunnel_log
      tunnel_log="$(cat "${LOG_DIR}/tunnel.log" 2>/dev/null || true)"
    fi
    say "Starting Cloudflare Quick Tunnel and waiting for its HTTPS link..."
    local link="" attempt
    for attempt in $(seq 1 30); do
      if has_systemd; then
        tunnel_log="$(journalctl -u "${TUNNEL_SERVICE}" --no-pager -n 100 2>/dev/null || true)"
      else
        tunnel_log="$(cat "${LOG_DIR}/tunnel.log" 2>/dev/null || true)"
      fi
      link="$(printf '%s' "$tunnel_log" | grep -Eo 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' | tail -n 1 || true)"
      [[ -n "$link" ]] && break
      sleep 1
    done
    if [[ -n "$link" ]]; then
      say "Panel link: ${link}"
      say "Open it in your browser and enter the OMCP username/password shown above."
    else
      warn "Tunnel URL is not ready yet. Check log: tail -f ${LOG_DIR}/tunnel.log (or journalctl -u ${TUNNEL_SERVICE} -f with systemd)"
    fi
  fi
  warn "This tunnel exposes the web panel only. Minecraft Java TCP routing is a separate OMCP Routing Engine and is not implemented by this preview installer yet."
}
ensure_access_config() {
  id omcp >/dev/null 2>&1 || useradd --system --home "${INSTALL_DIR}" --shell /usr/sbin/nologin omcp
  if [[ ! -s "${ENV_FILE}" ]]; then
    apt-get install -y openssl
    configure_access "$(cat "${MODE_FILE}" 2>/dev/null || echo ipv4)"
  elif [[ "$(cat "${MODE_FILE}" 2>/dev/null || echo ipv4)" == "non-ipv4" && ! -x /usr/local/bin/cloudflared ]]; then
    install_cloudflared
    write_tunnel_service
  fi
}
build_app() {
  cd "${APP_DIR}"
  npm install
  npm run build
  id omcp >/dev/null 2>&1 || useradd --system --home "${INSTALL_DIR}" --shell /usr/sbin/nologin omcp
  chown -R omcp:omcp "${INSTALL_DIR}"
  if [[ -f "${ENV_FILE}" ]]; then chown root:omcp "${ENV_FILE}"; chmod 0640 "${ENV_FILE}"; fi
  write_panel_service
  write_gateway_service
  if has_systemd; then
    systemctl daemon-reload
    systemctl restart "${SERVICE_NAME}" "${GATEWAY_SERVICE}"
    if [[ -f "${MODE_FILE}" ]] && [[ "$(cat "${MODE_FILE}")" == "non-ipv4" ]]; then
      systemctl restart "${TUNNEL_SERVICE}"
    fi
  else
    warn "systemd not detected; launching OMCP processes in background mode."
    start_background panel runuser -u omcp -- npm --prefix "${APP_DIR}" run preview -- --host 127.0.0.1 --port "${PORT}"
    load_gateway_env
    start_background gateway runuser -u omcp -- env OMCP_GATEWAY_HOST="${OMCP_GATEWAY_HOST}" OMCP_GATEWAY_PORT="${OMCP_GATEWAY_PORT}" OMCP_USERNAME="${OMCP_USERNAME}" OMCP_PASSWORD="${OMCP_PASSWORD}" node "${APP_DIR}/gateway.mjs"
    if [[ -f "${MODE_FILE}" ]] && [[ "$(cat "${MODE_FILE}")" == "non-ipv4" ]]; then
      start_background tunnel runuser -u omcp -- /usr/local/bin/cloudflared tunnel --no-autoupdate --url "http://127.0.0.1:${GATEWAY_PORT}"
    fi
  fi
}
install_panel() {
  local mode="${1:-}"
  need_root; need_debian
  [[ -n "$mode" ]] || fail "Specify network mode: install ipv4 OR install non-ipv4"
  apt-get update
  apt-get install -y ca-certificates curl git openssl
  ensure_node
  prepare_source
  id omcp >/dev/null 2>&1 || useradd --system --home "${INSTALL_DIR}" --shell /usr/sbin/nologin omcp
  configure_access "$mode"
  build_app
  say "OMCP Panel installed in ${mode} mode."
  show_access
  warn "Preview only: API authentication/RBAC, Connector provisioning, Minecraft server deployment and TCP routing are not production-ready."
}
update_panel() {
  need_root; need_debian; prepare_source; ensure_node
  ensure_access_config
  cd "${APP_DIR}"
  # The app directory is intentionally owned by the unprivileged omcp service user.
  # Mark it safe for this one Git invocation instead of weakening global Git checks.
  git -c "safe.directory=${APP_DIR}" pull --ff-only origin main
  build_app
  say "OMCP Panel updated."
  show_access
}
repair_panel() {
  need_root; need_debian; prepare_source; ensure_node
  ensure_access_config
  build_app
  say "OMCP Panel rebuilt and services restarted."
  [[ -f "${MODE_FILE}" ]] && show_access
}
uninstall_panel() {
  need_root
  read -r -p "Remove OMCP Panel, access gateway, tunnel and application files? [y/N] " answer </dev/tty
  [[ "$answer" == "y" || "$answer" == "Y" ]] || { say "Cancelled."; return; }
  if has_systemd; then
    systemctl disable --now "${SERVICE_NAME}" "${GATEWAY_SERVICE}" "${TUNNEL_SERVICE}" 2>/dev/null || true
  else
    stop_background panel
    stop_background gateway
    stop_background tunnel
  fi
  rm -f "${SERVICE_FILE}" "${GATEWAY_FILE}" "${TUNNEL_FILE}" "${ENV_FILE}"
  if has_systemd; then systemctl daemon-reload; fi
  rm -rf "${INSTALL_DIR}"
  say "OMCP removed. Node.js and system packages were left installed."
}
menu() {
  printf '\n  OMCP PANEL MANAGER\n  1) Install — IPv4 (direct public IP)\n  2) Install — Non-IPv4 (free HTTPS tunnel)\n  3) Update\n  4) Repair / rebuild\n  5) Uninstall\n  6) Exit\n\n'
  [[ -r /dev/tty ]] || fail "No interactive terminal. Use: install ipv4 OR install non-ipv4"
  read -r -p "Select an option: " choice </dev/tty
  case "${choice}" in
    1) install_panel ipv4 ;;
    2) install_panel non-ipv4 ;;
    3) update_panel ;;
    4) repair_panel ;;
    5) uninstall_panel ;;
    6) exit 0 ;;
    *) fail "Invalid selection." ;;
  esac
}
case "${1:-menu}" in
  install)
    case "${2:-}" in ipv4|non-ipv4) install_panel "$2" ;; *) fail "Usage: sudo bash install.sh install [ipv4|non-ipv4]" ;; esac
    ;;
  update) update_panel ;;
  repair) repair_panel ;;
  uninstall) uninstall_panel ;;
  menu|"") menu ;;
  ipv4) install_panel ipv4 ;;
  non-ipv4) install_panel non-ipv4 ;;
  *) fail "Usage: sudo bash install.sh [menu|install ipv4|install non-ipv4|update|repair|uninstall]" ;;
esac
