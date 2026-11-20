# OMCP Panel Architecture

## Service boundaries

- **Panel:** React UI for overview, servers, server creation, routing, connectors, users, extensions and settings.
- **API:** authentication, RBAC, database persistence, audit events, connector enrollment and server orchestration.
- **Connector:** authenticated host agent with heartbeat, verified host/network inventory and typed allowlisted server operations.
- **Routing Engine:** isolated Minecraft Java TCP ingress, public port allocation, encrypted connector tunnels and route health.
- **Database:** durable users, roles, servers, memberships, connectors, allocations, routes, backups and audit records.

## Network model

The network capability model must represent IPv4 and IPv6 independently: none, private, public, inbound reachable, and outbound capable. Do not infer public reachability from the presence of an address alone.

A shared public IPv4 address requires an actual reachable public relay/gateway. A private-only or IPv6-only origin can establish an authenticated outbound tunnel to that relay. The relay forwards Minecraft Java TCP to a server port on the Connector side. Software cannot manufacture public IPv4 connectivity where no provider supplies a reachable relay.

A routing allocation binds a unique public endpoint and port to one Connector identity and one server target. Allocate/release ports transactionally. Drain active connections before replacing routes. Use authenticated encrypted tunnels, expiry, replay protection, rate limits and health checks. HTTP reverse proxying is not a substitute for Minecraft Java TCP forwarding.

## Security invariants

1. The API is authoritative for identity, authorization, desired state and allocation ownership.
2. Connector enrollment tokens are one-time, scoped and expiring.
3. Connector commands are typed, server-scoped, authenticated, time-bounded and replay-resistant.
4. No panel user receives arbitrary host shell access.
5. Server filesystem operations are confined to the server root and reject traversal and symlink escapes.
6. Every privileged mutation is permission-checked and audited.
7. Secrets are never sent to browser clients; credentials are hashed or encrypted at rest.
8. Telemetry is timestamped and sourced from a Connector. Stale or missing data is displayed as unavailable.

## Initial implementation stack

- React + TypeScript + Vite for the Panel.
- TypeScript API with validated request/response contracts.
- PostgreSQL for durable state and migrations.
- Dedicated Connector process with least-privilege host access.
- Dedicated TCP routing process, isolated from the web API.
- Linux deployment adapters for systemd and supervised foreground operation.

The current repository contains a frontend foundation and a preview-only installer. Backend, Connector, database and routing services remain future implementation work.
