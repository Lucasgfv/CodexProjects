FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS builder
ENV AUTH_SECRET=build-only-secret-not-used-at-runtime-2026
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build?schema=public
COPY . .
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts /app/tsconfig.json ./
EXPOSE 3000
CMD ["pnpm", "start", "--hostname", "0.0.0.0"]
