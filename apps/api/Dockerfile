FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --filter @exchange/api... --no-frozen-lockfile
RUN pnpm --filter @exchange/api prisma:generate
RUN pnpm --filter @exchange/shared build
RUN pnpm --filter @exchange/api build

EXPOSE 3000
CMD ["pnpm", "--filter", "@exchange/api", "start"]
