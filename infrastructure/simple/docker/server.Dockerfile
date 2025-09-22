# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY turbo.json ./
COPY packages ./packages
COPY apps ./apps

RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn install --immutable

RUN DO_NOT_TRACK=1 TURBO_TELEMETRY_DISABLED=1 yarn turbo run build --filter=@aipacto/apps-server

# Runtime stage
FROM node:24-alpine

WORKDIR /app

COPY --from=builder /app/apps/server/dist /app/dist

ENV NODE_ENV=production

HEALTHCHECK CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["node", "dist/index.js"]
