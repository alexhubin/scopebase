# ScopeBase architecture

## System boundaries

ScopeBase uses one deployable web application and one API. The architecture favors transparent operational behavior over distributed infrastructure.

The TanStack Start frontend renders the marketing site and application shell with SSR, then hydrates React in the browser. TanStack Query owns remote state. Access tokens remain in memory; the browser sends an HttpOnly refresh cookie to recover a session.

FastAPI owns authentication, authorization, validation, workflow transitions, public-link resolution, billing enforcement, email dispatch, PDF generation, and storage metadata. PostgreSQL is the system of record. Files are stored only in S3-compatible object storage.

## Domain organization

The backend is organized around business capabilities:

- `auth` owns access tokens, refresh rotation, password reset, and principals;
- `organizations` owns tenant membership and profile settings;
- `projects` owns project status and dashboard summaries;
- `briefs` owns templates, project snapshots, and client answers;
- `scopes` owns drafts, immutable versions, publishing, decisions, and PDFs;
- `change_requests` owns additional work and client decisions;
- `files` owns upload policy, presigned URLs, metadata, and deletion;
- `activity` owns the human-readable audit timeline;
- `billing` owns plan state, Stripe synchronization, and feature enforcement;
- `email` provides the transactional delivery abstraction;
- `common` contains cross-domain infrastructure rather than business workflows.

SQLAlchemy models never leave the API directly. Pydantic response models define every public contract.

## Tenant authorization

Protected routes resolve a user, organization membership, and project relationship on the server. A project lookup includes its organization boundary, preventing cross-tenant access even if an internal UUID is known.

Public client access uses long random tokens. Only token hashes are stored. A public link is limited to one resource kind and one resource, may expire, and can be revoked. It does not create a general client session or expose organization settings.

## Workflow invariants

### Briefs

A project brief stores a template snapshot. Editing the source template cannot alter what a client received. A submitted brief cannot be submitted again through the same link.

### Scopes

Only draft scopes are mutable. Publishing changes a draft to `sent`. A decision references that exact scope identifier and version. A later version is a new database row; it never overwrites a published version.

### Change requests

A draft can be edited. Publishing changes it to `pending`. An accepted request updates project price and delivery date in the same transaction as the recorded decision.

### Files

The API validates the requested filename, MIME type, size, plan storage quota, and generated key before issuing a presigned URL. Confirmation verifies object metadata before creating the database record.

## Billing boundary

All feature limits are enforced by backend workflows. The frontend may explain a plan restriction but is never the authority.

`LocalBillingProvider` supports deterministic local development. `StripeBillingProvider` owns checkout and portal sessions. Verified, idempotent webhooks synchronize subscription state into the organization row.

## Runtime topology

Development Compose includes PostgreSQL, MinIO, Mailpit, backend, frontend, and Caddy.

The production Compose project exposes one application loopback port:

- `127.0.0.1:3080` for the internal ScopeBase gateway;

Cloudflare R2 provides production object storage through its S3-compatible HTTPS API. The API issues short-lived presigned PUT and GET URLs so file bytes travel directly between the browser and R2. The VPS's existing Caddy instance terminates TLS and proxies only the application hostname. A host-level Caddy uses the loopback port; a containerized Caddy shares one external Docker network with only the ScopeBase gateway. ScopeBase does not bind the host's public HTTP or HTTPS ports.
