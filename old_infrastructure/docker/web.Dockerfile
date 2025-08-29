# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Copy Turbo configuration
COPY turbo.json ./

# Copy full workspace sources to preserve workspace graph for Yarn
COPY packages ./packages
COPY apps ./apps

# Install all dependencies with immutable lockfile
RUN yarn install --immutable

# Build the web app using Turbo for optimized builds
WORKDIR /app
RUN DO_NOT_TRACK=1 TURBO_TELEMETRY_DISABLED=1 yarn turbo run build --filter=@aipacto/apps-web

# Production stage - SSR runtime
FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache tini curl

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder /app/apps/web/.output /app/.output

USER nodejs

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "/app/.output/server/index.mjs"]
