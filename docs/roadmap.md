# ONION-OMCP Implementation Roadmap

This roadmap is a set of gates, not a claim that these features are already implemented.

## Phase 0 — Repository foundation
- [x] Confirm target repository and default branch.
- [x] Create an isolated feature branch.
- [x] Document product boundaries and architecture.
- [ ] Add workspace manifests, lint/typecheck/test tooling and CI.
- [ ] Add threat model and dependency/license review.

## Phase 1 — Panel and API foundation
- [ ] Choose and pin supported runtime versions.
- [ ] Create Panel shell with responsive Admin and Server sidebars.
- [ ] Add API service, typed request/response contracts and health endpoints.
- [ ] Add PostgreSQL schema, migrations and migration tests.
- [ ] Implement secure first-admin bootstrap, login, sessions, password reset and rate limits.
- [ ] Add RBAC, server ownership and granular membership permissions.
- [ ] Add audit events for privileged operations.

## Phase 2 — Connector
- [ ] Implement one-time, expiring, scoped enrollment.
- [ ] Generate and persist Connector identity keys.
- [ ] Implement authenticated heartbeat and reconnect/backoff.
- [ ] Report verified OS, CPU, RAM, disk, network and server inventory.
- [ ] Implement typed allowlisted command channel with replay protection.
- [ ] Implement Connector health, update, repair and revocation.
- [ ] Test no-systemd and systemd service adapters.

## Phase 3 — Network and routing
- [ ] Detect public/private IPv4 and IPv6 without conflating address families.
- [ ] Detect interfaces, default routes, DNS, firewall and inbound reachability.
- [ ] Model actual routing endpoints and their address families.
- [ ] Implement transactional public port allocation and conflict handling.
- [ ] Implement authenticated encrypted Connector-to-router tunnel.
- [ ] Implement Minecraft Java TCP forwarding, drain, health and reconnect.
- [ ] Test IPv4-only, IPv6-only, dual-stack, private-only and unreachable cases.
- [ ] Document provider prerequisites: a relay with public IPv4 is required for IPv4-only clients when the origin has no public IPv4.

## Phase 4 — Server deployment and lifecycle
- [ ] Implement wizard with owner selection and resource validation.
- [ ] Query real Connector capacity and configured over-allocation policy.
- [ ] Integrate official metadata/download sources for server software.
- [ ] Validate checksums where available and stage installs atomically.
- [ ] Implement start/stop/restart/kill with authorization and idempotency.
- [ ] Stream real console logs and commands over authenticated WebSocket.
- [ ] Test failure, retry, reinstall and rollback paths.

## Phase 5 — Server management
- [ ] Implement server-scoped file manager with traversal/symlink protections.
- [ ] Implement properties editor and restart-required detection.
- [ ] Implement plugin discovery/install/update/remove with compatibility checks.
- [ ] Implement Fabric/Forge/NeoForge mod manager and dependency checks.
- [ ] Implement safe version changes with backup and rollback.
- [ ] Implement worlds and player actions supported by each server type.
- [ ] Implement sub-users and permission review/revocation.
- [ ] Implement isolated SFTP access and scheduled/manual backups.

## Phase 6 — Admin and operations
- [ ] Implement overview from live persisted telemetry.
- [ ] Implement users, servers, Connectors, routing, extensions and activity logs.
- [ ] Implement branding, auth, registration and security settings.
- [ ] Implement extension manifest, permission model and isolation strategy.
- [ ] Add pagination, indexes, background jobs, metrics and structured logs.

## Phase 7 — Installer and release
- [ ] Build installer only after deployment architecture is stable.
- [ ] Detect distribution, architecture, resources, systemd, Docker, persistent storage and dynamic ports.
- [ ] Generate secrets and initialize database safely.
- [ ] Configure supervised foreground mode where systemd is absent.
- [ ] Verify actual health endpoint and print only verified URL.
- [ ] Implement backup-preserving update, repair and confirmation-gated uninstall.
- [ ] Run fresh Ubuntu/Debian, network-failure, permission and end-to-end test matrices.
- [ ] Publish install/update/repair/uninstall commands only after they pass CI and staging tests.

## Release rule

A UI control is not a completed feature. A feature is complete only when its authorized backend operation, failure handling, audit behavior and relevant automated/integration tests exist. No fabricated telemetry, downloads, install progress, route status or success messages.
