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

## Install the preview

On Debian/Ubuntu with root access:

```bash
curl -fsSL https://raw.githubusercontent.com/notmronionji/ONION-OMCP/main/install.sh | sudo bash
```

The installer opens a menu for install, update, repair and uninstall. To run a specific action:

```bash
curl -fsSL https://raw.githubusercontent.com/notmronionji/ONION-OMCP/main/install.sh | sudo bash -s -- install
curl -fsSL https://raw.githubusercontent.com/notmronionji/ONION-OMCP/main/install.sh | sudo bash -s -- update
curl -fsSL https://raw.githubusercontent.com/notmronionji/ONION-OMCP/main/install.sh | sudo bash -s -- repair
curl -fsSL https://raw.githubusercontent.com/notmronionji/ONION-OMCP/main/install.sh | sudo bash -s -- uninstall
```

The preview binds to `127.0.0.1:6767` only. To view it from your computer, create an SSH tunnel:

```bash
ssh -L 6767:127.0.0.1:6767 your-user@your-server
```

Then open `http://127.0.0.1:6767` on your computer. Do not expose this unauthenticated preview to the public internet.

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
