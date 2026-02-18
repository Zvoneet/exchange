# Assistant Exchange

Open-source assistant registry + discovery service built as a Turborepo monorepo.

## Stack

- Monorepo: `pnpm` workspaces + Turborepo
- Backend: NestJS + Prisma + MySQL
- Frontend: React + Vite + TypeScript
- Shared contracts: `packages/shared` with Zod schemas + TS types

## Repository Structure

```text
apps/
  api/          NestJS API server
  web/          React admin UI
packages/
  shared/       shared types + Zod schemas
  config/       shared TS/ESLint config
```

## Core Features

- Agent registration with immutable `exchangeAgentId` UUID
- Registration mode: `open` or `code_required`
- Agent auth with short-lived JWT + hashed refresh tokens
- Refresh token rotation on refresh
- Handle claim + public lookup by `@handle`
- Presence heartbeat (`lastSeenAt`, optional `publicUrl`)
- Structured discovery search
- Intent discovery search through `AiQueryMapper`
  - `mock` provider implemented
  - `openai` provider included as stub
- Admin UI:
  - login
  - agents list + detail panel
  - registration config toggle/code update
- Security/ops basics:
  - Helmet + CORS
  - global validation pipe
  - throttling for auth/registration endpoints
  - request logging without sensitive fields

## Prerequisites

- Node.js 20+ (tested with 22)
- pnpm 10+
- MySQL 8+

## Local Development

1. Install dependencies:

```bash
pnpm install
```

2. Configure environment:

- Copy `apps/api/.env.example` to `apps/api/.env`
- Copy `apps/web/.env.example` to `apps/web/.env`

3. Start MySQL (Docker recommended):

```bash
docker compose up -d mysql
```

4. Generate Prisma client + run migration + seed config:

```bash
pnpm --filter @exchange/api prisma:generate
pnpm db:migrate
pnpm db:seed
```

5. Start API + Web:

```bash
pnpm dev
```

- API: `http://localhost:3000/v1`
- Web: `http://localhost:5173`
- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs-json`

## Scripts

- `pnpm dev` - run api + web (and shared watch) via turbo
- `pnpm build` - build all packages
- `pnpm db:migrate` - run Prisma migration (dev)
- `pnpm db:seed` - seed `ExchangeConfig` row (id=1)

## API Overview

All API routes are under `/v1`.

### Registration + Auth

- `POST /agents/register`
- `POST /auth/refresh`
- `POST /auth/revoke`

### Agent Identity

- `POST /agents/handle`
- `GET /agents/@:handle`
- `POST /agents/heartbeat`

### Discovery

- `POST /discovery/search`
- `POST /discovery/intent`

### Admin

- `POST /admin/login`
- `GET /admin/agents`
- `GET /admin/agents/:id`
- `GET /admin/config`
- `PATCH /admin/config`

## Docker Compose

`docker-compose.yml` includes:

- `mysql` on `3306`
- `api` on `3000`
- `web` on `5173` (served from nginx)

Bring up full stack:

```bash
docker compose up --build
```

## Security Notes (MVP)

- Refresh tokens are hashed (`sha256`) at rest
- Registration code is hashed with `bcrypt`
- Admin password is validated with `bcrypt` hash
  - Use `ADMIN_PASSWORD_HASH` in production
- JWT access tokens default to `15m`
- Auth + registration endpoints are rate limited
- Request logger intentionally avoids logging body/secret-bearing headers

## Scaling Notes

- API is stateless and horizontally scalable
- State is persisted in MySQL
- Discovery geo filtering currently uses in-memory Haversine after DB narrowing
- For production-scale geo search, migrate to spatial indexes and DB-native geo operators

## License

MIT (recommended for open-source use).
