# syntax = docker/dockerfile:1

# Build stage
FROM node:24-alpine AS build

WORKDIR /repo

# Enable Corepack for pnpm
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy package manager configuration
COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./

# Copy workspace files
COPY turbo.json ./

# Disable Git hooks installation in container builds: the root package.json has
# "prepare": "lefthook install", which requires git and is not needed in Docker.
# We neutralize it before running pnpm install to avoid failures and keep image slim.
RUN sed -i 's/"prepare": "lefthook install"/"prepare": ""/' package.json

COPY apps/server/package.json ./apps/server/
COPY packages/shared/typescript-config/package.json ./packages/shared/typescript-config/
COPY packages/shared/utils/env/package.json ./packages/shared/utils/env/
COPY packages/shared/utils/logging/package.json ./packages/shared/utils/logging/

# Install all dependencies with cache mount (CI=true skips prepare script)
RUN --mount=type=cache,target=/root/.pnpm-store \
    CI=true pnpm install --frozen-lockfile

# Copy source code before installing dependencies to avoid symlink issues
COPY apps/server/src ./apps/server/src
COPY apps/server/tsdown.config.ts ./apps/server/tsdown.config.ts
COPY apps/server/tsconfig.json ./apps/server/tsconfig.json
COPY packages/shared/utils/env/src ./packages/shared/utils/env/src
COPY packages/shared/utils/env/tsconfig.json ./packages/shared/utils/env/tsconfig.json
COPY packages/shared/utils/logging/src ./packages/shared/utils/logging/src
COPY packages/shared/utils/logging/tsconfig.json ./packages/shared/utils/logging/tsconfig.json
COPY packages/shared/typescript-config ./packages/shared/typescript-config

# Build the server
RUN DO_NOT_TRACK=1 TURBO_TELEMETRY_DISABLED=1 pnpm turbo run build --filter=@aipacto/apps-server

# Production dependencies stage
FROM node:24-alpine AS deps

WORKDIR /repo

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy package configuration
COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/typescript-config/package.json ./packages/shared/typescript-config/
COPY packages/shared/utils/env/package.json ./packages/shared/utils/env/
COPY packages/shared/utils/logging/package.json ./packages/shared/utils/logging/

# Install production dependencies only
RUN --mount=type=cache,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile --filter @aipacto/apps-server --prod --ignore-scripts

# Final production stage
FROM node:24-alpine

LABEL fly_launch_runtime="Node.js"

WORKDIR /app

# Copy built server
COPY --from=build /repo/apps/server/dist ./dist

# Copy production dependencies
COPY --from=deps /repo/node_modules ./node_modules

# Copy workspace packages (built)
COPY --from=build /repo/packages/shared/utils/env ./node_modules/@aipacto/shared-utils-env
COPY --from=build /repo/packages/shared/utils/logging ./node_modules/@aipacto/shared-utils-logging

# Set runtime environment
ENV NODE_ENV=production \
    SERVER_HOST=0.0.0.0 \
    SERVER_PORT=8080 \
    PORT=8080

# Expose the port
EXPOSE 8080

# Start the server
CMD ["node", "dist/index.js"]
