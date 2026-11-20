# ONION-OMCP Architecture

## Principles

1. The API is the authority for identity, authorization, allocations and desired state.
2. A Connector is trusted only after short-lived enrollment and key-based identity verification.
3. The Panel never receives arbitrary shell access to a host. It sends typed, authorized operations to a Connector.
4. Every server belongs to a registered user and a Connector; all operations re-check ownership and granular permissions server-side.
5. Telemetry is timestamped and sourced from a Connector. Missing/stale data is shown as unavailable, never replaced with sample values.
6. Network capability is measured, not inferred from an IP string or provider label.
7. File operations are rooted in a server-specific directory and reject traversal, symlink escapes and cross-server paths.
8. Destructive operations require explicit confirmation and a recoverable backup/rollback path.

## Service boundaries

### Panel
- Admin routes: overview, users, servers, connectors, extensions, routing, activity and settings.
- Server routes: console, files, properties, worlds, players, plugins, mods, version, startup, network, SFTP, backups, sub-users and settings.
- UI components call the API; they do not fabricate state or perform privileged host operations.

### API
- Authentication/session service, RBAC and per-server permission checks.
- Database migrations and repositories.
- Connector enrollment, heartbeat, health and command dispatch.
- Server orchestration and audit events.
- Background jobs for metadata refresh, backups and reconciliation.

### Connector
- Generates a persistent local identity and host inventory.
- Detects OS, architecture, interfaces, private/public IPv4/IPv6, default routes, disk, CPU and memory.
- Maintains an outbound authenticated connection to the control plane where possible.
- Executes a strict allowlist of typed server operations.
- Reports command result, heartbeat, resource metrics and server inventory.
- Does not expose host shell or arbitrary filesystem access to panel users.

### Routing Engine
- Accepts Minecraft Java TCP traffic only on explicitly allocated listeners.
- Uses a control-plane allocation mapping from public endpoint/port to Connector tunnel and server port.
- Connector-to-router tunnels are authenticated and encrypted; route registration is bound to Connector identity.
- Allocations are unique and transactionally reserved/released.
- Health checks distinguish DNS, TCP ingress, tunnel and backend reachability.
- IPv6 listeners and upstreams are supported when the host/network actually provides them.
- IPv4-only clients reach IPv6-only or private hosts through an IPv4-capable public relay, if configured. This requires a reachable relay endpoint; software cannot create public IPv4 where no provider supplies one.

## Suggested implementation stack

- TypeScript monorepo for Panel and API to share validated contracts.
- React + Vite for the Panel; Express/Fastify-style HTTP API and WebSocket event transport.
- PostgreSQL for durable state and migrations.
- A dedicated Connector service with least-privilege host permissions.
- A separate TCP routing process, isolated from the web API.
- Docker Compose for local development; Linux service/supervisor adapters for deployment.

The exact framework and process model must be confirmed by implementation tests before installer commands are published.

## Core data model (initial)

- users, roles, sessions
- servers, server_memberships, server_permissions
- connectors, connector_keys, connector_heartbeats, connector_metrics
- allocations, routing_endpoints, routes, route_health
- server_installations, server_backups
- extensions, extension_permissions
- audit_events, settings, enrollment_tokens

All identifiers are opaque IDs. Secrets are stored hashed or encrypted where appropriate and are never returned to the browser.

## Enrollment and command security

1. Admin creates an enrollment intent scoped to one Connector, with expiry and one-time use.
2. Connector generates its own key pair and submits the enrollment proof over TLS.
3. API validates the intent, binds the Connector public key and issues a revocable credential.
4. Connector authenticates every heartbeat and command channel message.
5. Commands include a unique ID, expiry, server scope, operation type and authorization context.
6. Connector rejects expired, replayed, unknown or out-of-scope commands.
7. Results are signed/associated with the authenticated Connector and recorded in the audit log.

## Routing allocation flow

1. Connector reports verified host/network capabilities.
2. Admin configures an actual reachable routing endpoint.
3. API reserves a unique public TCP port in a database transaction.
4. Connector creates/starts the server on a private/local port.
5. Router installs the authenticated mapping and verifies backend reachability.
6. API marks the route active only after a successful health check.
7. Server deletion or route change drains connections and releases allocations safely.

A DNS record alone does not provide TCP proxying. Ordinary HTTP reverse proxies and standard orange-cloud HTTP CDN proxying are not Minecraft Java TCP routers.

## Operational requirements

- Structured logs with request, command, Connector and server IDs.
- Explicit connect/read/write timeouts and bounded retries.
- Idempotency for server lifecycle and allocation mutations.
- Pagination and indexes for list endpoints.
- Rate limits on login, enrollment and sensitive mutations.
- CSRF protection for cookie-authenticated browser mutations.
- Secure, HttpOnly, SameSite cookies and strong password hashing.
- Health/readiness endpoints that report dependency state.
- Backups and migrations tested before upgrades.
- No systemd assumption: service manager adapters must include systemd and supervised foreground modes.
