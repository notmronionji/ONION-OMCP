# OMCP Panel

**ONION Minecraft Control Panel** — an independent Minecraft hosting control panel.

> **Status: early development.** The current repository contains a premium dark React dashboard foundation and a localhost-only frontend preview installer. Server provisioning, API authentication, Connector operations, database persistence and TCP routing are not production-ready.

## Product

- Premium dark dashboard with responsive Admin and Server experiences.
- Original OMCP branding, layouts, animations and components.
- Minecraft server creation workflow with software, host, resources, network, tunnel and routing choices.
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

**Important:** the current installer exposes the web-panel preview behind login. It does not yet deploy the API, Connector, Minecraft server processes or Minecraft Java TCP Routing Engine. Minecraft public IP/port routing remains a separate backend implementation task; a Cloudflare web Quick Tunnel is not used as a Minecraft TCP relay.

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
| API | Authentication, authorization, persistence, audit and orchestration |
| Connector | Secure VPS enrollment, heartbeat, telemetry and server operations |
| Routing Engine | Minecraft Java TCP ingress, port allocations, authenticated tunnels and health checks |
| Database | Users, roles, servers, connectors, allocations, routes and audit events |

See `docs/architecture.md` and `docs/roadmap.md`.

## Reference and implementation

The JTG repository may be consulted as a visual/workflow reference. OMCP uses an original implementation; no third-party source code or assets are copied without a compatible license or explicit permission.
