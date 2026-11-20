# OMCP Panel Roadmap

## Phase 1 — Panel foundation
- [x] Establish OMCP branding and responsive dark dashboard shell.
- [x] Add Overview, Servers, Routing and Connectors sections.
- [x] Add multi-step server creation UI with host, resources, network and routing choices.
- [x] Add preview-only Debian/Ubuntu installer and systemd service.
- [ ] Add automated lint, typecheck and browser tests.
- [ ] Connect all UI views to typed API contracts.

## Phase 2 — API and identity
- [ ] PostgreSQL schema and migrations.
- [ ] Secure first-admin bootstrap, authentication and session lifecycle.
- [ ] RBAC, server ownership and granular sub-user permissions.
- [ ] Audit log, rate limits and security headers.
- [ ] API health and readiness endpoints.

## Phase 3 — OMCP Connector
- [ ] One-time expiring enrollment and key-based Connector identity.
- [ ] Authenticated heartbeat, reconnect and revocation.
- [ ] Host inventory: OS, CPU, RAM, disk, interfaces, IPv4, IPv6 and routes.
- [ ] Typed allowlisted server operations with replay protection.
- [ ] systemd and supervised foreground service adapters.

## Phase 4 — IPv4/IPv6 and routing
- [ ] Detect public/private IPv4 and IPv6 independently.
- [ ] Verify inbound/outbound reachability instead of assuming it.
- [ ] Configure real public relay endpoints.
- [ ] Transactional port allocation and conflict handling.
- [ ] Authenticated encrypted Connector-to-router tunnel.
- [ ] Minecraft Java TCP forwarding, draining, health and reconnect.
- [ ] Test IPv4-only, IPv6-only, dual-stack and private-only hosts.

## Phase 5 — Minecraft server lifecycle
- [ ] Software metadata, download and checksum verification.
- [ ] Capacity-aware server deployment and resource validation.
- [ ] Start, stop, restart and kill with idempotency.
- [ ] Real-time console stream and command dispatch.
- [ ] Safe reinstall, version change, backup and rollback.

## Phase 6 — Server management
- [ ] Files, properties, worlds, players and startup configuration.
- [ ] Plugins, Fabric/Forge/NeoForge mods and compatibility checks.
- [ ] SFTP, backups, schedules and restore.
- [ ] Sub-users and granular permissions.

## Phase 7 — Admin operations and release
- [ ] User, server, Connector, routing, extension and activity management.
- [ ] Extension permission model and isolation.
- [ ] Production installer with secrets, database, TLS/reverse proxy and health verification.
- [ ] Backup-preserving update, repair and confirmation-gated uninstall.
- [ ] End-to-end tests on supported distributions and network topologies.

## Release rule

A visible control is not a completed feature. A feature is complete only when its backend operation, authorization, failure handling, audit behavior and automated/integration tests exist. Never present mock telemetry or preview actions as real infrastructure state.
