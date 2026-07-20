# ScopeBase

ScopeBase is a focused portfolio SaaS for freelancers and small agencies. It turns scattered client conversations into a clear, approved project scope and keeps later additions visible through explicit change requests.

The repository is currently under active implementation.

## Architecture

ScopeBase is a monorepo with a React frontend, a FastAPI backend, PostgreSQL, S3-compatible object storage, Mailpit, and Caddy.

```text
scopebase/
  frontend/
  backend/
  infrastructure/
  docs/
  docker-compose.yml
```

## Local development

Copy the environment file before starting the stack:

```bash
cp .env.example .env
docker compose up --build
```

The web application is available at `http://localhost:3000`, API documentation at `http://localhost:3000/docs`, Mailpit at `http://localhost:8025`, and the MinIO console at `http://localhost:9001`.

Further setup, testing, deployment, demo data, and security documentation will be added as the implementation progresses.

