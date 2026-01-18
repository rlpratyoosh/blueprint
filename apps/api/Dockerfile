FROM node:24-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@9.0.0


FROM base AS pruner
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
RUN turbo prune --scope=api --docker


FROM base AS builder
WORKDIR /app


COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# RUN echo "shamefully-hoist=true" > .npmrc

RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=api...

RUN pnpm prune --prod

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

RUN apk add --no-cache openssl

USER nestjs

COPY --from=builder --chown=nestjs:nestjs /app .

WORKDIR /app/apps/api

EXPOSE 8000
CMD ["node", "dist/main.js"]
