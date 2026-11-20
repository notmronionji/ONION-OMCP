# ONION-OMCP

An independent Minecraft hosting control plane with its own Panel, API, Connector and TCP routing services.

> **Development status: foundation / not production-ready.** This repository is being built incrementally. Do not expose it to the public internet or use it to host production workloads until the security and end-to-end test gates in the roadmap have passed.

## Product goals

- A responsive dark hosting dashboard with separate Admin and Server experiences.
- OMCP Connectors instead of Pterodactyl Nodes/Wings.
- IPv4, IPv6 and dual-stack capability detection.
- Shared public endpoints and authenticated Minecraft Java TCP routing for hosts without public IPv4.
- Server lifecycle, console, files, properties, plugins/mods, versions, worlds, players, SFTP and backups.
- Real telemetry and explicit error states; no fabricated status or success messages.

## Repository boundaries

- **ONION-OMCP** is the implementation target.
- **OMCP-BETA** remains separate and must not be modified by this project.
- [JTG Panel](https://github.com/JishnuTheGamer/Jtg) is a workflow and visual-reference project only. OMCP will use an original implementation. No JTG source code or assets are copied into this repository. Review the reference repository's license and obtain permission before reusing any protected material.

## Planned architecture

| Component | Responsibility |
|---|---|
| Panel | Admin/user UI, server UI, setup and branding |
| API | Authentication, RBAC, persistence, audit log and orchestration |
| Connector | VPS identity, secure registration, heartbeat, telemetry and server operations |
| Routing Engine | Public TCP ingress, port allocation, authenticated connector tunnels and health |
| Database | Users, servers, connectors, allocations, routes, permissions and audit events |

## Development

The project is currently at the foundation stage. Runtime commands will be documented after the corresponding application and tests exist. Do not run an installer copied from another project.

See [docs/architecture.md](docs/architecture.md) and [docs/roadmap.md](docs/roadmap.md) for design decisions and implementation gates.
