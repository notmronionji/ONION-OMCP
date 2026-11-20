# OMCP Panel

**ONION Minecraft Control Panel** — an independent Minecraft hosting control panel.

> **Status: early development.** OMCP now includes a local Minecraft agent for real server provisioning, process control and per-server TCP routing. Multi-host Connector enrollment, database-backed RBAC and production-grade routing infrastructure remain future work.

## Product

- Premium dark dashboard with responsive Admin and Server experiences.
- Original OMCP branding, layouts, animations and components.
- Real server provisioning through the local agent: downloads supported Minecraft server software, prepares server files and tracks creation jobs.
- Start/stop/restart and console process management for created servers.
- Per-server TCP routing adapters for Minekube Connect, Bore and Pinggy (provider/network limitations apply).
- IPv4, IPv6 and dual-stack capability detection (backend work pending).
- Shared public IPv4 routing for private/IPv6-only origins through a configured public relay (routing service pending).
- Planned console, files, properties, plugins/mods, versions, worlds, players, SFTP, backups and permissions.
- Separate API, Connector, database and TCP routing engine.

## Install OMCP

On Debian/Ubuntu with root access, run:

```bash
curl -fsSL https://raw.githubusercontent.com/notmronionji/ONION-OMCP/main/install.sh | sudo bash
```

Choose one of the two network modes in the installer:

- **IPv4:** direct public IPv4 link on port 6768. Allow TCP 6768 in your VPS/provider firewall.
- **Non-IPv4:** starts a free Cloudflare Quick Tunnel and prints an HTTPS `trycloudflare.com` link. No domain or Cloudflare account is required. The link can change when the tunnel restarts.

Both modes put a password-protected gateway in front of the panel. The generated password is stored in `/etc/omcp-panel.env`; keep it private. The panel preview itself listens only on localhost.

Non-interactive install commands:

```bash
curl -fsSL https://raw.githubusercontent.com/notmronionji/ONION-OMCP/main/install.sh | sudo bash -s -- install ipv4
curl -fsSL https://raw.githubusercontent.com/notmronionji/ONION-OMCP/main/install.sh | sudo bash -s -- install non-ipv4
```

Update, repair and uninstall:

```bash
curl -fsSL https://raw.githubusercontent.com/notmronionji/ONION-OMCP/main/install.sh | sudo bash -s -- update
curl -fsSL https://raw.githubusercontent.com/notmronionji/ONION-OMCP/main/install.sh | sudo bash -s -- repair
curl -fsSL https://raw.githubusercontent.com/notmronionji/ONION-OMCP/main/install.sh | sudo bash -s -- uninstall
```

**Important:** the installer runs a local Python agent on `127.0.0.1:8765` behind the authenticated gateway. The first browser visit requires the gateway login shown by the installer, followed by creation of a separate OMCP admin account. On non-IPv4 hosts, Cloudflare Quick Tunnel publishes only the panel HTTPS endpoint. Minecraft player traffic is handled separately by the per-server TCP routing providers; it is not carried by the Cloudflare web tunnel. Server creation downloads software but does not automatically start the server or establish a route.

## Local development

Requirements: Node.js 20+ and npm.

```bash
git clone https://github.com/notmronionji/ONION-OMCP.git
cd ONION-OMCP
npm install
npm run dev
```

## Architecture

| Service | Responsibility |
|---|---|
| Panel | Admin dashboard, server dashboard and server creation workflow |
| Local Agent | Authenticated API, server provisioning, Java process control, files and TCP route adapters |
| Connector | Secure VPS enrollment, heartbeat, telemetry and server operations |
| Routing Engine | Minecraft Java TCP ingress, port allocations, authenticated tunnels and health checks |
| Database | Users, roles, servers, connectors, allocations, routes and audit events |

See `docs/architecture.md` and `docs/roadmap.md`.

## Reference and implementation

The JTG repository may be consulted as a visual/workflow reference. OMCP uses an original implementation; no third-party source code or assets are copied without a compatible license or explicit permission.
