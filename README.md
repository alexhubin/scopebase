# ScopeBase

ScopeBase is a focused portfolio SaaS for freelancers and small agencies. It turns scattered client conversations into a clear, approved project scope and keeps later additions visible through explicit change requests.

It is intentionally not a generic project-management product. ScopeBase does not include task boards, time tracking, invoicing, meetings, or CRM features.

## Product workflow

1. A freelancer creates a project.
2. They select or customize a structured brief.
3. The client completes the brief through a secure public link and uploads source files.
4. The freelancer creates a structured scope and publishes an immutable version.
5. The client approves that exact version or requests changes.
6. Additional work is documented as a priced change request with delivery impact.
7. ScopeBase records every meaningful action in the project timeline.

## Screenshots

The repository is ready for portfolio screenshots of the following views:

- marketing landing page and pricing;
- freelancer dashboard and project workspace;
- brief question editor and client preview;
- versioned scope editor and approval portal;
- change request decision portal;
- activity timeline.

## Capabilities

- short-lived JWT access tokens and rotating refresh tokens in secure HttpOnly cookies;
- owner and member organization authorization enforced by the API;
- system and custom brief templates with validated question schemas;
- revocable, expiring public links stored as token hashes;
- immutable published scope versions and version-specific approvals;
- server-generated approved-scope PDFs;
- priced change requests with client acceptance or rejection;
- direct S3-compatible uploads with MIME, size, and storage-limit enforcement;
- transactional email delivery through SMTP, with Mailpit in development;
- Stripe checkout, customer portal, verified webhooks, and an isolated local billing adapter;
- meaningful activity events, pagination, filtering, request IDs, health checks, and readiness checks;
- responsive client portals designed for mobile use.

## Architecture

```text
Browser
  |
  v
Caddy
  |-- /, /client/*  -> TanStack Start SSR frontend
  |-- /api/*        -> FastAPI
  |-- /docs         -> OpenAPI UI
  |
  +-- PostgreSQL
  +-- S3-compatible storage
  +-- SMTP provider
  +-- Stripe
```

The monorepo is organized by product and business domains:

```text
scopebase/
  frontend/
  backend/
  infrastructure/
  docs/
  docker-compose.yml
  docker-compose.production.yml
```

See [Architecture](docs/ARCHITECTURE.md) for boundaries, data flow, and important implementation decisions.

## Tech stack

| Area | Technology |
| --- | --- |
| Web | React 19, TypeScript strict mode, TanStack Start, TanStack Router, Vite |
| Data and forms | TanStack Query, React Hook Form, Zod |
| UI | Tailwind CSS 4, Base UI, Lucide icons |
| API | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2 |
| Data | PostgreSQL 18, Alembic, S3-compatible object storage |
| Auth | JWT access tokens, rotating refresh tokens, Argon2 |
| Billing | Stripe or local development adapter |
| Quality | pytest, Ruff, mypy, Vitest, React Testing Library, ESLint |
| Runtime | Docker Compose, Caddy, TanStack Start SSR on Nitro |

## Local setup

Requirements:

- Docker with Compose v2;
- ports `3000`, `443`, `8025`, and `9001` available.

Start the complete development stack:

```bash
cp .env.example .env
docker compose up --build
```

The backend container applies migrations and seeds the demo workspace on startup.

| Service | URL |
| --- | --- |
| ScopeBase | http://localhost:3000 |
| API documentation | http://localhost:3000/docs |
| OpenAPI schema | http://localhost:3000/openapi.json |
| Mailpit | http://localhost:8025 |
| MinIO console | http://localhost:9001 |

Stop the stack without deleting data:

```bash
docker compose down
```

Delete local volumes only when a complete local reset is intended:

```bash
docker compose down --volumes
```

## Demo workspace

```text
Email: demo@scopebase.dev
Password: DemoPass123!
Organization: Northstar Studio
```

The idempotent seed includes three realistic projects, a submitted website brief, scopes in approval and approved states, a pending change request, and activity events.

Run the seed manually:

```bash
docker compose exec backend uv run python -m app.seed
```

## Environment variables

Use `.env.example` for local development and `.env.production.example` as the production checklist.

| Variable | Purpose |
| --- | --- |
| `APP_ENV` | Enables production secret validation and runtime behavior |
| `SECRET_KEY` | Signs access, refresh, reset, and public-link tokens |
| `DATABASE_URL` | Async PostgreSQL connection string |
| `FRONTEND_URL` | Internal links in application responses and billing redirects |
| `PUBLIC_APP_URL` | Base URL used in client invitation links |
| `CORS_ORIGINS` | Comma-separated trusted browser origins |
| `COOKIE_SECURE` | Requires HTTPS for refresh cookies in production |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` | Transactional email transport |
| `STORAGE_PROVIDER` | `minio` for local development or `r2` in production |
| `S3_ENDPOINT_URL` | Backend-to-storage endpoint |
| `S3_PUBLIC_ENDPOINT_URL` | Browser-accessible endpoint used in presigned URLs |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` | Object-storage credentials and bucket |
| `S3_REGION`, `S3_AUTO_CREATE_BUCKET` | Provider region and runtime bucket provisioning policy |
| `MAX_UPLOAD_BYTES` | Per-file size ceiling |
| `BILLING_ADAPTER` | `local` or `stripe` |
| `STRIPE_SECRET_KEY` | Stripe server key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature secret |
| `STRIPE_PRICE_PRO` | Recurring Pro price identifier |

Never commit `.env` or `.env.production`.

## Database migrations

Apply all migrations:

```bash
docker compose exec backend uv run alembic upgrade head
```

Create a migration after changing SQLAlchemy models:

```bash
docker compose exec backend uv run alembic revision --autogenerate -m "describe change"
```

Review every autogenerated migration before applying it.

## Tests and checks

Backend:

```bash
cd backend
uv sync --group dev
uv run ruff check app tests
uv run mypy app
uv run pytest
```

Frontend:

```bash
cd frontend
npm ci
npm run lint
npm test
npm run build
```

The integration suite covers authentication, authorization, public-link isolation, brief submission, immutable scopes, version-specific approvals, change decisions, billing idempotency, and the three client portal journeys.

## Deployment

ScopeBase is prepared for a single VPS without taking ownership of the host's existing ports `80` and `443`. The production stack binds only its internal gateway to `127.0.0.1:3080`, uses Cloudflare R2 for object storage, and leaves the existing Caddy instance responsible for public HTTPS. A containerized Caddy can instead reach the stable gateway alias over the configured external Docker network.

```bash
cp .env.production.example .env.production
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

Read [VPS deployment](docs/DEPLOYMENT.md) before the first deployment. It covers DNS, existing Caddy integration, migrations, Stripe webhooks, object storage, backups, rollback, and verification.

## Security model and limitations

ScopeBase implements a practical SaaS baseline: server-side tenant authorization, normalized email addresses, Argon2 password hashing, access-token expiry, refresh rotation, hashed public tokens, link revocation, rate limits, secure cookies, upload restrictions, Stripe signature verification, and request IDs.

ScopeBase does not claim enterprise compliance. Client approval is a version-specific product record, not a qualified electronic or digital signature. Production operators remain responsible for host hardening, secrets management, encrypted backups, dependency updates, monitoring, abuse controls, and local legal requirements.

See [Security](docs/SECURITY.md) for the threat boundary and production checklist.

## Roadmap

- organization member invitations and role management UI;
- branded email and PDF customization;
- reusable organization-level custom-template management;
- storage usage reporting and retention controls;
- optional audit-log export;
- expanded browser-level end-to-end coverage.
