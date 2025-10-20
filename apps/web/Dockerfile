# ============================================
# Stage 1: Base Image with pnpm
# ============================================
FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# ============================================
# Stage 2: Prune monorepo with Turbo
# ============================================
FROM base AS pruner

WORKDIR /app

# Install Turbo
RUN pnpm add -g turbo@2.5.8

# Copy ONLY what's needed for turbo prune
COPY . .

# Prune to get minimal workspace
RUN turbo prune @aipacto/apps-web --docker

# ============================================
# Stage 3: Install dependencies
# ============================================
FROM base AS deps

WORKDIR /app

# Copy pruned lockfile and package.json files from json folder
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Disable Git hooks installation in container builds. The root package.json has
# a prepare script (lefthook install) which requires git and is unnecessary
# during Docker image builds. Neutralize it to prevent failures on Fly.
RUN if [ -f package.json ]; then \
      sed -i 's/"prepare": "lefthook install"/"prepare": ""/' package.json || true; \
    fi

# Install dependencies with frozen lockfile
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ============================================
# Stage 4: Build application
# ============================================
FROM base AS builder

WORKDIR /app

# Install Turbo
RUN pnpm add -g turbo@2.5.8

# Increase Node.js heap for SSR/Nitro build and silence telemetry
ENV NODE_OPTIONS="--max-old-space-size=4096" \
    DO_NOT_TRACK=1 \
    TURBO_TELEMETRY_DISABLED=1

# Propagate client API base to Vite at build-time
ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=${VITE_SERVER_URL}

# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages

# Copy full source from pruner
COPY --from=pruner /app/out/full/ .

# Build the application
ENV NODE_ENV=production
RUN turbo run build --filter=@aipacto/apps-web

# ============================================
# Stage 5: Production runner
# ============================================
FROM node:22-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 tanstack

# Copy ONLY the build output - not node_modules
COPY --from=builder --chown=tanstack:nodejs /app/apps/web/.output ./.output

USER tanstack

EXPOSE 4173

ENV NODE_ENV=production
ENV PORT=4173
ENV NITRO_PORT=4173
ENV NITRO_HOST=0.0.0.0

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4173/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", ".output/server/index.mjs"]
