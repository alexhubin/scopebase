# VPS deployment

This guide assumes Docker Compose v2 and an existing host-level Caddy installation. ScopeBase deliberately does not replace the host Caddy configuration or bind public ports.

## DNS

Create two DNS records pointing to the VPS:

- the application hostname, such as `scopebase.example.com`;
- the object-storage hostname, such as `scopebase-storage.example.com`.

Both hostnames must resolve before Caddy requests certificates.

## Prepare the project

Clone the repository into a dedicated directory and create the production environment file:

```bash
git clone git@github.com:alexhubin/scopebase.git /opt/scopebase
cd /opt/scopebase
cp .env.production.example .env.production
chmod 600 .env.production
```

Replace every placeholder. Generate independent secrets. If a database password contains URL-reserved characters, percent-encode it in `DATABASE_URL`.

Required production choices:

- `APP_ENV=production`;
- a random `SECRET_KEY` of at least 32 characters;
- matching PostgreSQL credentials and `DATABASE_URL`;
- HTTPS application and public-link URLs;
- `COOKIE_SECURE=true`;
- a browser-accessible HTTPS `S3_PUBLIC_ENDPOINT_URL`;
- the application origin in `S3_CORS_ORIGINS`;
- real SMTP settings;
- either the isolated local billing adapter or complete Stripe credentials.

## Start without touching public ports

Validate the rendered configuration and inspect port ownership before starting:

```bash
docker compose -f docker-compose.production.yml config --quiet
ss -lntp | grep -E ':3080|:3090' || true
```

Build and start:

```bash
docker compose -f docker-compose.production.yml up -d --build
docker compose -f docker-compose.production.yml ps
```

The backend applies Alembic migrations before starting workers. Demo data is not seeded automatically in production.

## Connect the existing Caddy instance

Add only the required sites to the existing Caddy configuration. Preserve all unrelated imports, global options, and Northstar configuration.

```caddyfile
scopebase.example.com {
  reverse_proxy 127.0.0.1:3080
}

scopebase-storage.example.com {
  reverse_proxy 127.0.0.1:3090
}
```

Format and validate before reloading:

```bash
caddy fmt --overwrite /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Use the host's actual Caddy service or container workflow if it differs. Never replace the complete configuration with the example above.

## Verification

Verify the internal stack first:

```bash
curl --fail http://127.0.0.1:3080/api/health
curl --fail http://127.0.0.1:3080/api/ready
curl --fail http://127.0.0.1:3080/
```

Then verify HTTPS, authentication, client links, an object upload, Mail delivery, and an approved-scope PDF from an external browser.

Inspect logs without printing the environment file:

```bash
docker compose -f docker-compose.production.yml logs --tail=200 backend frontend gateway minio
```

## Seed the portfolio demo

Run this only when the VPS is intentionally hosting the demo workspace:

```bash
docker compose -f docker-compose.production.yml exec backend uv run python -m app.seed
```

The seed is idempotent and creates the `Northstar Studio` workspace with `demo@scopebase.dev`.

## Stripe

Set `BILLING_ADAPTER=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO`, and `STRIPE_WEBHOOK_SECRET`.

Configure the Stripe endpoint:

```text
https://scopebase.example.com/api/billing/webhooks/stripe
```

Subscribe to customer subscription created, updated, and deleted events. Send a test event and verify the backend log before enabling production checkout.

## Backups

Create consistent PostgreSQL dumps on a schedule and copy them off the VPS:

```bash
docker compose -f docker-compose.production.yml exec -T postgres pg_dump -U scopebase -d scopebase -Fc > scopebase.dump
```

Back up the MinIO volume or replicate its bucket to independent object storage. Database-only backups are incomplete because PostgreSQL stores file metadata, not file bytes.

Also retain the deployment commit SHA and encrypted production environment file in an approved secrets system. Test restoration on a separate machine.

## Updating

```bash
cd /opt/scopebase
git fetch origin
git pull --ff-only origin main
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
docker compose -f docker-compose.production.yml ps
```

The migration command runs before the API starts. Review new migrations and release notes before updating production.

## Rollback

Application rollback is a Git checkout of a known commit followed by an image rebuild. Database rollback must be planned per migration; do not blindly downgrade a database containing newer production data.

If a release fails before a destructive migration, return to the previous commit and rebuild. If a migration changed data incompatibly, restore the tested backup under an explicit incident plan.
