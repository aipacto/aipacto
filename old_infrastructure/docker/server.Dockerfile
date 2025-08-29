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

# Install dependencies with immutable lockfile
RUN yarn install --immutable

# Build the server using Turbo for optimized builds
WORKDIR /app
RUN DO_NOT_TRACK=1 TURBO_TELEMETRY_DISABLED=1 yarn turbo run build --filter=@aipacto/apps-server

# Production stage
FROM node:24-alpine

WORKDIR /app

# Install production runtime dependencies
RUN apk add --no-cache tini curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy only the runtime workspace packages needed by the server
COPY --from=builder /app/packages/agents/domain ./packages/agents/domain
COPY --from=builder /app/packages/agents/infrastructure/langchain ./packages/agents/infrastructure/langchain
COPY --from=builder /app/packages/shared/domain ./packages/shared/domain
COPY --from=builder /app/packages/shared/ui/localization ./packages/shared/ui/localization
COPY --from=builder /app/packages/shared/utils/env ./packages/shared/utils/env
COPY --from=builder /app/packages/shared/utils/logging ./packages/shared/utils/logging
COPY --from=builder /app/packages/workspace/domain ./packages/workspace/domain
COPY --from=builder /app/packages/workspace/infrastructure/authz ./packages/workspace/infrastructure/authz
COPY --from=builder /app/packages/workspace/infrastructure/storage ./packages/workspace/infrastructure/storage

# Create necessary directories
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
