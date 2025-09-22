# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY turbo.json ./
COPY packages ./packages
COPY apps ./apps

RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn install --immutable

RUN DO_NOT_TRACK=1 TURBO_TELEMETRY_DISABLED=1 yarn turbo run build --filter=@aipacto/apps-web

# Runtime stage: static server
FROM node:24-alpine

WORKDIR /app

RUN npm i -g serve@14.2.3 && addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=builder /app/apps/web/dist /app/dist

USER nodejs

HEALTHCHECK CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]


