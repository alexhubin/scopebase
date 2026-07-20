# VPS deployment

This guide assumes Docker Compose v2 and an existing Caddy installation. ScopeBase deliberately does not replace the existing Caddy configuration or bind public ports.

## DNS

Create one DNS record pointing to the VPS:

- the application hostname, such as `scopebase.example.com`.

The hostname must resolve before Caddy requests a certificate. An `sslip.io` hostname may be used for a demonstration deployment without managing DNS. R2 presigned URLs use Cloudflare's S3 API domain directly and do not need a VPS DNS record.

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
- `STORAGE_PROVIDER=r2`;
- identical `S3_ENDPOINT_URL` and `S3_PUBLIC_ENDPOINT_URL` values using `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` without a bucket path;
- `S3_REGION=auto` and `S3_AUTO_CREATE_BUCKET=false`;
- an R2 Object Read & Write token scoped to the production bucket;
- real SMTP settings;
- either the isolated local billing adapter or complete Stripe credentials.

Create the bucket before deployment. Configure its CORS policy in the Cloudflare dashboard or with Wrangler so the application can use presigned URLs from a browser:

```json
[
  {
    "AllowedOrigins": ["https://scopebase.example.com"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Use the exact production origin rather than `*`. See Cloudflare's [R2 authentication](https://developers.cloudflare.com/r2/api/tokens/), [CORS](https://developers.cloudflare.com/r2/buckets/cors/), and [presigned URL](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) documentation.

The production Compose file includes Mailpit on a loopback-only port for portfolio and staging deployments without SMTP credentials. Replace `SMTP_HOST=mailpit` with a real authenticated provider before using ScopeBase for real client communication.

Set `CADDY_NETWORK` to an external Docker network shared with a containerized Caddy instance. If Caddy runs directly on the host, create a dedicated unused external network for Compose and use the loopback ports for proxying.

## Start without touching public ports

Validate the rendered configuration and inspect port ownership before starting:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml config --quiet
ss -lntp | grep ':3080' || true
```

Build and start:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
docker compose --env-file .env.production -f docker-compose.production.yml ps
```

The backend applies Alembic migrations before starting workers. Demo data is not seeded automatically in production.

## Connect the existing Caddy instance

For a host-level Caddy installation, proxy to the loopback ports:

```caddyfile
scopebase.example.com {
  reverse_proxy 127.0.0.1:3080
}
```

Format and validate before reloading:

```bash
caddy fmt --overwrite /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Use the host's actual Caddy service or container workflow if it differs. Never replace the complete configuration with the example above.

For a containerized Caddy installation, attach only the ScopeBase gateway to Caddy's existing external network. Set `CADDY_NETWORK` to its exact name and route to the stable alias:

```caddyfile
scopebase.example.com {
  reverse_proxy scopebase-gateway:80
}
```

The checked-in `infrastructure/caddy/Caddyfile.scopebase` contains an immediately usable `sslip.io` variant. Merge that snippet into the existing configuration; do not replace unrelated sites.

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
docker compose --env-file .env.production -f docker-compose.production.yml logs --tail=200 backend frontend gateway
```

## Seed the portfolio demo

Run this only when the VPS is intentionally hosting the demo workspace:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml exec backend uv run python -m app.seed
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
docker compose --env-file .env.production -f docker-compose.production.yml exec -T postgres pg_dump -U scopebase -d scopebase -Fc > scopebase.dump
```

Back up or replicate the R2 bucket independently from PostgreSQL. Database-only backups are incomplete because PostgreSQL stores file metadata, not file bytes.

Also retain the deployment commit SHA and encrypted production environment file in an approved secrets system. Test restoration on a separate machine.

## Updating

```bash
cd /opt/scopebase
git fetch origin
git pull --ff-only origin main
docker compose --env-file .env.production -f docker-compose.production.yml build
docker compose --env-file .env.production -f docker-compose.production.yml up -d
docker compose --env-file .env.production -f docker-compose.production.yml ps
```

The migration command runs before the API starts. Review new migrations and release notes before updating production.

## Rollback

Application rollback is a Git checkout of a known commit followed by an image rebuild. Database rollback must be planned per migration; do not blindly downgrade a database containing newer production data.

If a release fails before a destructive migration, return to the previous commit and rebuild. If a migration changed data incompatibly, restore the tested backup under an explicit incident plan.
