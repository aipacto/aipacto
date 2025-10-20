# Contributing to Aipacto

Thank you for your interest in contributing to Aipacto! We're building an AI-driven Operating System for city councils and local governments, starting with a revolutionary tender writer application for Spanish municipalities. This guide will help you get started and understand our development workflow and requirements.

## Prerequisites

- **Nix** (for reproducible development environment)
  - **Recommended:** [Determinate Systems Nix Installer](https://zero-to-nix.com/start/install/) (single command, works on Linux/macOS/WSL)
  - **Alternative:** [Official NixOS installer](https://nixos.org/download.html)

  Nix ensures everyone uses the exact same versions of Node.js, pnpm, TypeScript, and other tools. No more "works on my machine" issues!

- **Watchman** (for file watching and hot reloading)
  - **Linux:** Install using [Homebrew](https://brew.sh/):

    ```bash
    # Install Homebrew for Linux if you don't have it
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Install Watchman
    brew install watchman
    ```

  - **macOS:** `brew install watchman`
  - **Windows:** Download from [Watchman releases](https://github.com/facebook/watchman/releases)
  
  Watchman improves file watching performance and is required for optimal development experience with hot reloading.

## Getting Started

1. **Install Nix:**
   - **Recommended:** Use the [Determinate Systems Nix Installer](https://zero-to-nix.com/start/install/) for the best experience
   - **Alternative:** Follow the [official NixOS guide](https://nixos.org/download.html) if you prefer the traditional installer

2. **Enter the development shell:**
   In the project root, run:

   ```bash
   nix develop
   ```

   This drops you into a shell with the correct Node.js, pnpm, TypeScript, and required tools.

   Optional: direnv auto-enter
   - This repo includes an `.envrc` with `use flake` for seamless entry.
   - If you use direnv (+ nix-direnv), run `direnv allow` once in the repo, then simply `cd` into the folder to auto-enter the dev shell.
   - Works on macOS, Linux, and WSL.

   Prefer zsh inside nix?
   - Run `nix develop -c zsh` to start the dev shell with zsh.
   - In VS Code, the workspace terminal already uses your default shell inside nix (zsh if your `SHELL` is zsh).

3. **Install dependencies:**

   ```bash
   pnpm install
   ```

4. **Prepare environment files:**

   ```bash
   cp apps/server/.env.example apps/server/.env
   cp apps/server/.env.docker.example apps/server/.env.docker
   cp apps/web/.env.example apps/web/.env
   cp apps/web/.env.docker.example apps/web/.env.docker
   ```

   - Replace placeholders (especially secrets such as `BETTER_AUTH_SECRET`) before running the apps.
   - For Docker usage, ensure the SQLite databases exist locally:

     ```bash
     touch apps/server/auth.db apps/server/documents.db
     ```

5. **Run the applications (pnpm workflows):**

   From the dev shell you can start the back end and web app independently:

   ```bash
   pnpm --filter @aipacto/apps-server dev
   pnpm --filter @aipacto/apps-web dev
   ```

   > The top-level `pnpm web` command launches the Expo target; use the package-scoped command above for the Vite/TanStack web app.

6. **Run the applications (Docker Compose):**

   A root-level `docker-compose.yaml` keeps both services in sync with their respective Dockerfiles.

   ```bash
   # Build images and start both apps (foreground logs)
   docker compose up --build

   # Build and start only one service (foreground)
   docker compose up --build server
   docker compose up --build web

   # Run everything in the background (detached)
   docker compose up --build -d

   # Start a single service in the background after images are built
   docker compose up -d server
   docker compose up -d web
   ```

   - The server listens on `http://localhost:8080` and persists `auth.db` / `documents.db` via bind mounts.
   - The web app listens on `http://localhost:4173` and uses `apps/web/.env.docker`:
     - SSR runtime `SERVER_URL=http://server:8080` (container-to-container via Compose)
     - Client build `VITE_SERVER_URL=http://localhost:8080` (browser-to-host; Compose passes this as a build arg)
   - Stop everything with `Ctrl+C` (foreground) or `docker compose down`. For detached containers use:
     ```bash
     docker compose stop            # stop all services
     docker compose stop server     # stop only the server
     docker compose stop web        # stop only the web app
     ```
   - Remove stopped containers and network with `docker compose down`. If a named container already exists (e.g., `/aipacto-server`), remove it with `docker rm -f aipacto-server` (or run `docker compose down`) before starting again.

> **Note:** All pnpm commands below assume you are inside the Nix dev shell (`nix develop`), while Docker commands work from any shell with Docker Compose V2 available.

## Testing & Health Checks

### Accessing the Services

The services run on different ports depending on how you start them:

**Local Development (pnpm):**

- **Server API**: `http://localhost:3000`
- **Web Application**: `http://localhost:3001`
  - Note: Vite proxies `/auth` and `/v1` requests to the server automatically

**Docker Compose:**

- **Server API**: `http://localhost:8080`
- **Web Application**: `http://localhost:4173`

### Server Health Check

Test the server is running correctly with curl:

**For pnpm development:**

```bash
# Basic health check
curl http://localhost:3000/health

# Check with verbose output
curl -v http://localhost:3000/health

# Test CORS headers
curl -H "Origin: http://localhost:3001" -v http://localhost:3000/health
```

**For Docker Compose:**

```bash
# Basic health check
curl http://localhost:8080/health

# Check with verbose output
curl -v http://localhost:8080/health

# Test CORS headers
curl -H "Origin: http://localhost:4173" -v http://localhost:8080/health
```

Expected response: HTTP 200 OK with the server's health status or API information.

### Testing Scenarios

**Local Development (pnpm):**

1. Start the server: `pnpm --filter @aipacto/apps-server dev`
2. In another terminal, start the web app: `pnpm --filter @aipacto/apps-web dev`
3. Visit `http://localhost:3001` in your browser
4. Test the server API: `curl http://localhost:3000/`

**Docker Compose:**

1. Build and start services: `docker compose up --build`
2. Visit `http://localhost:4173` in your browser
3. Test the server health: `curl http://localhost:8080/`
4. Check logs: `docker compose logs -f server` or `docker compose logs -f web`

## SSR, Routing & Auth Across Environments

This project uses Vite + TanStack Start (SSR) with Nitro. The same stack runs in pnpm dev, local Docker, and production. Follow these guidelines to avoid SSR pitfalls and ensure cookies, routing, and WebSockets work consistently.

### Stack Overview

- Vite serves the client bundle (HMR in dev).
- TanStack Start drives routing and server functions.
- Nitro provides the SSR runtime (dev worker in pnpm dev, Node server in prod).

Key files:

- Vite proxy: `apps/web/vite.config.ts:70`
- Client auth: `apps/web/src/hooks/use_auth.tsx:1`
- Server functions: `apps/web/src/server/auth.ts:1`, `apps/web/src/server/functions/documents.ts:1`
- Docs editor (browser API calls): `apps/web/src/routes/_authenticated/docs/$docId.tsx:34`
- Server auth routes: `apps/server/src/routes/auth.ts:1`
- Server document routes: `apps/server/src/routes/documents.ts:1`

### Client-Only Boundaries (SSR Safety)

- Do not instantiate browser-only SDKs during SSR. For example, create the Better Auth client (`better-auth/react`) only in the browser. Provide an SSR-safe stub so server rendering does not trigger client network calls.
- Use TanStack’s `<ClientOnly>` for components that rely on `window`, `document`, WebSockets, or other browser APIs (the docs editor is already wrapped).
- In server functions (TanStack `createServerFn`), always use `fetch` with string URLs (not `Request` objects) to keep Nitro dev happy.

Common Nitro dev pitfall: Passing a `Request` instance to `fetch` during SSR causes “Invalid URL … input: [object Request]”. Keep SSR calls as `fetch('https://…')` or `fetch('/path')` strings.

### API Routes (One Shape Everywhere)

- The backend exposes:
  - Auth: `/auth/*`
  - API: `/v1/*` (e.g., `/v1/docs/:docId`)
- The web app must call `/auth` and `/v1` only (no `/api` prefix). In dev, use relative paths to leverage the Vite proxy; in Docker/prod, use an absolute origin from env.

### Base URL Resolution

- Runtime for SSR: `SERVER_URL` (preferred in Docker/prod)
- Build-time for browser: `VITE_SERVER_URL` (absolute origin used by the browser)

Environment matrix:

- pnpm dev
  - Browser: use relative URLs (`/auth`, `/v1`) → Vite proxy routes to `http://localhost:3000`.
  - Leave `VITE_SERVER_URL` unset.
  - SSR server functions can fall back to `http://localhost:3000` if needed.

- Local Docker (Compose)
  - Web SSR: `SERVER_URL=http://server:8080`
  - Browser: `VITE_SERVER_URL=http://localhost:8080`
  - Compose already passes these via `docker-compose.yaml` and `apps/web/Dockerfile`.

- Production (HTTPS)
  - Web SSR: `SERVER_URL=https://api.<your-domain>`
  - Browser: `VITE_SERVER_URL=https://api.<your-domain>`
  - Server auth (Better Auth): `BETTER_AUTH_BASE_URL=https://api.<your-domain>`; for cross-subdomain cookies, add `BETTER_AUTH_COOKIE_DOMAIN=.your-domain`.

### Cookies & CORS

- pnpm dev (HTTP): Cookies are non-Secure. Using relative URLs with the Vite proxy keeps cookies same-origin and avoids CORS.
- Local Docker (HTTP): Browsers ignore `Secure` cookies. Set `BETTER_AUTH_INSECURE_COOKIES=true` in `apps/server/.env.docker` so the API emits non-Secure cookies.
- Production (HTTPS): Use `Secure` cookies. Set `BETTER_AUTH_BASE_URL` to your HTTPS API origin; optionally set `BETTER_AUTH_COOKIE_DOMAIN` for cross-subdomain cookies.
- CORS: For non-proxied environments, ensure `ALLOWED_ORIGINS` includes the web origin (see `apps/server/.env.*`).

### WebSockets

- In dev, `getWebSocketUrl` builds a ws URL on the current origin; Vite proxy forwards WS to the backend (see `vite.config.ts` where `ws: true` is set for `/v1`).
- In Docker/prod, it builds `ws(s)://<VITE_SERVER_URL host>/v1/...`.

### Quick Checklist

- pnpm dev
  - Do not set `VITE_SERVER_URL`.
  - Use relative `/auth` and `/v1` in browser code.
  - Avoid instantiating browser-only SDKs during SSR.

- Local Docker
  - `SERVER_URL=http://server:8080` (SSR)
  - `VITE_SERVER_URL=http://localhost:8080` (browser)
  - `BETTER_AUTH_INSECURE_COOKIES=true` (HTTP-only)

- Production
  - `SERVER_URL` and `VITE_SERVER_URL` both `https://api.<your-domain>`
  - `BETTER_AUTH_BASE_URL=https://api.<your-domain>`; optionally `BETTER_AUTH_COOKIE_DOMAIN=.your-domain`

Following these patterns keeps SSR stable in dev, ensures cookies work across environments, and aligns browser/SSR calls with the server’s `/auth` and `/v1` routes.

## Monorepo Structure & Workspaces

Aipacto uses a monorepo managed with pnpm workspaces, organized around our tender writer application and municipal AI system. Each package/app has its own scripts. To run scripts for a specific package, use:

```sh
pnpm --filter <package> <script>
```

## Contributing & PR Workflow

- **Branching:**
  - Never commit or push directly to `main`. Use feature branches and open a Pull Request (PR).
- **PR Types:**
  - Use **Draft PRs** for work-in-progress (WIP). Mark as "Ready for review" when complete.
  - Only **squash** or **rebase** merges are allowed (no merge commits).
- **CI/CD:**
  - GitHub Actions will run for all non-draft PRs and pushes to `main`.
  - Draft PRs will skip CI until marked ready.
- **Pre-commit hooks:**
  - Managed by Lefthook. Run checks for lint, types, secrets, and dependency consistency.

### Local Enforcement of Merge Policy

- **No direct commits or pushes to `main` are allowed.**  
  Our hooks will block any attempt to commit or push directly to the `main` branch.

- **On feature branches:**
  - **Before every commit** the following quick checks run automatically:
    - Lint (`pnpm lint`)
    - Dependency consistency (`pnpm check-deps`)
    - Secret scan of staged files (`pnpm secretlint`)
  - **Before every push** additional enforcement runs:
    - Blocks direct pushes to `main` branch
    - Blocks merge commits to `main` branch (only rebase/squash allowed)
  - You can commit and push freely on feature branches. Heavy checks (type-checking, build, etc.) run in CI when you open a PR.
  - **Tip:** Use rebase or squash when your work is ready, then push and create a Pull Request.

## Pre-commit Checks

When you commit staged files, several automated checks will run (see `lefthook.yml`):

- **Block Main Commits**: Prevents direct commits to `main` branch
- **Linting**: Code style and formatting (`pnpm lint`)
- **Dependency Version Consistency**: Ensures all packages use compatible versions (`pnpm check-deps`)
- **Secret Scanning**: Prevents committing secrets (`pnpm secretlint` on staged files)

If any check fails, your commit will be blocked. **You must fix all errors before committing.**

## Pre-push Checks

Additional checks run before pushing:

- **Block Main Push**: Prevents direct pushes to `main` branch
- **Block Merge Commits**: Prevents merge commits to `main` (enforces rebase/squash)

## Coding Standards

- Follow Clean Architecture and DDD principles (bounded contexts for procurement, municipal data, AI agents)
- Use TypeScript for all code (frontend and backend)
- For UI: Use Tamagui, Material Design 3, and custom tokens optimized for municipal interfaces
- Add new UI text to appropriate i18n files (Spanish/Catalan support for `common.json`)
- Prefer start/end over left/right for layout (LTR support, future RTL compatibility)
- Apply accessibility best practices (WCAG 2.1 AA for public sector compliance)
- Keep code and comments clear and concise
- Document public APIs with JSDoc, especially for tender processing functions

## CI & Quality

- **Build:** `pnpm build`
- **Lint:** `pnpm lint`
- **Type Check:** `pnpm check-types`
- **Secrets:** `pnpm check-secrets`
- **Dependencies versioning:** `pnpm check-deps`

## Domain Knowledge

Contributing to Aipacto benefits from understanding:

- **Spanish Public Procurement**: Familiarity with LCSP (Ley de Contratos del Sector Público) and PLACSP portal
- **Municipal Operations**: Understanding of city council workflows and administrative processes
- **AI/LLM Integration**: Experience with LangChain, document processing, or Spanish language models
