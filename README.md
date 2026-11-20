# OMCP Panel

**ONION Minecraft Control Panel** — an independent Minecraft hosting control panel.

> **Status: early development.** The repository is being populated directly on `main`. The current UI is a frontend foundation; server provisioning, routing, tunnel transport and installer operations are not production-ready until their backend implementations and integration tests are complete.

## Product

- Premium dark dashboard with responsive Admin and Server experiences.
- Original OMCP branding, layouts, animations and components.
- Minecraft server creation with connector, network, tunnel and routing configuration.
- IPv4, IPv6 and dual-stack capability detection.
- Shared public IPv4 routing for private/IPv6-only origins through a configured public relay.
- Server console, files, properties, plugins/mods, versions, worlds, players, SFTP, backups and permissions.
- Separate API, Connector, database and TCP routing engine.

## Architecture

| Service | Responsibility |
|---|---|
| Panel | Admin dashboard, server dashboard and server creation workflow |
| API | Authentication, authorization, persistence, audit and orchestration |
| Connector | Secure VPS enrollment, heartbeat, telemetry and allowlisted server operations |
| Routing Engine | Minecraft Java TCP ingress, port allocations, authenticated tunnels and health checks |
| Database | Users, roles, servers, connectors, allocations, routes and audit events |

## Development

Requirements: Node.js 20+ and npm.

```bash
git clone https://github.com/notmronionji/ONION-OMCP.git
cd ONION-OMCP
npm install
npm run dev
```

The frontend currently runs as a UI foundation. Do not use it to provision real servers or expose it publicly until the API, Connector, routing security and deployment installer are implemented and tested.

## Reference and implementation

The JTG repository may be consulted as a visual/workflow reference. This project uses an original OMCP implementation; it does not claim ownership of third-party source or assets. Reuse of third-party code requires a compatible license or explicit permission.

See `docs/architecture.md` and `docs/roadmap.md` for design and delivery gates.
