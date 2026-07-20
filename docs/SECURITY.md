# Security notes

## Implemented baseline

- Argon2 password hashing;
- normalized unique email addresses;
- short-lived JWT access tokens held in browser memory;
- rotating, server-tracked refresh tokens delivered through HttpOnly cookies;
- password-reset tokens with expiry and one-time state;
- organization and project authorization on protected API actions;
- hashed, random, expiring, revocable public client links;
- endpoint rate limiting for authentication and public access;
- strict Pydantic validation and structured API errors;
- allowed-origin CORS policy with credentials;
- upload MIME, size, key, metadata, and storage-quota validation;
- no executable upload types;
- Stripe webhook signature validation and idempotency;
- request IDs attached to server errors;
- production refusal of weak application secrets.

## Production checklist

- generate unique high-entropy values for the application, database, R2, SMTP, and Stripe secrets;
- set `APP_ENV=production` and `COOKIE_SECURE=true`;
- use only HTTPS origins in `FRONTEND_URL`, `PUBLIC_APP_URL`, `CORS_ORIGINS`, and storage CORS;
- restrict the ScopeBase origin port to loopback or a private network;
- keep PostgreSQL off the public internet;
- scope the R2 application token to Object Read & Write for the production bucket only;
- keep R2 buckets private and use short-lived presigned URLs for browser access;
- configure a real SMTP provider with authenticated transport;
- configure Stripe webhooks only over HTTPS;
- enable host firewalling, unattended security updates, log rotation, and monitoring;
- back up PostgreSQL and object storage, encrypt backups, and test restoration;
- rotate secrets immediately if an environment file or backup is exposed;
- regularly rebuild images and review dependency advisories.

## Explicit limitations

The in-process rate limiter is suitable for a single API deployment. Multiple API replicas require a shared rate-limit store.

Approval records are product workflow evidence. They are not qualified electronic signatures and do not provide legal identity verification.

ScopeBase does not provide enterprise compliance certification, malware scanning, data-loss prevention, regional data residency controls, or a managed backup service.
