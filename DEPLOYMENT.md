# Deployment Guide

Deployment targets use Fly.io Machines with Docker images built from the repository. This document consolidates both the server (`apps/server`) and web (`apps/web`) workflows and includes DNS guidance for Cloudflare (or other registrars).

## Prerequisites

- Fly CLI (`flyctl`) authenticated with an organization that owns the target apps.
- Docker 24+ and Node.js 22+ with pnpm 9 (`nix develop` provides the pinned toolchain).
- Access to production databases (LibSQL/Turso) and any third-party secrets.
- Domain DNS access (Cloudflare instructions included below).
- Commands below use POSIX-style shells. On Windows, run them from Git Bash, WSL, or adapt them to PowerShell (all secrets generation examples include a cross-platform Node alternative).

## First-Time Setup (Recommended)

For newcomers, use the interactive CLI tool to set up your development environment:

```bash
git clone <repository-url>
cd <repository>
pnpm install
pnpm setup
```

This will automatically:

1. Copy `.env.example` files to `.env` for all apps
2. Build the entire monorepo
3. Guide you through environment configuration

See `apps/cli/README.md` for more details on the CLI toolkit.

## Environment & Secrets

- Non-sensitive defaults live in each app's `fly.toml`. Update them directly and commit them.
- Sensitive values **must** be provided at deploy time via `fly secrets set`.
- Shared runtime keys:
  - Server: `BETTER_AUTH_SECRET`, `DATABASE_AUTH_URL`, `DATABASE_AUTH_SECRET`, `DATABASE_URL`, `DATABASE_TOKEN` (Turso prod only), optional overrides like `ALLOWED_ORIGINS`, `BETTER_AUTH_BASE_URL`, `BETTER_AUTH_COOKIE_DOMAIN`.
  - Web: `VITE_SERVER_URL` (non-secret but usually lives in `fly.toml`), extra API keys if the frontend calls third parties.
- Generate high-entropy secrets with either `openssl rand -base64 32` (macOS/Linux) or `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"` (works on macOS, Linux, and Windows).

Example secret bootstrap lives in the Launching & Monitoring section below—run it right after creating each app and adjust values per environment. Remember that Fly Machines never inherit secrets from Docker images; every machine is populated from the app-level secret store, so update secrets before new machines are created.

## Local Validation

From the repository root:

```bash
pnpm install
pnpm --filter @aipacto/apps-server build
pnpm --filter @aipacto/apps-web build
```

For end-to-end Docker workflows (Compose, standalone images, runtime env files), see the "Run the applications (Docker Compose)" section in `CONTRIBUTING.md`.

## Fly Deployments

All commands assume the repository root; provide explicit config paths so Fly finds the right Dockerfile.

### Launching & Monitoring Fly Apps

1. Confirm the target application exists (creates it on first run):

   ```bash
   fly apps list
   fly apps create aipacto-server      # only once per app, you can also create an app on Fly Dashboard https://fly.io/dashboard/ and with `fly apps create aipacto-server --org <organization>` or Dashboard
   fly apps create aipacto-web         # only once per app
   ```

2. Prime the environment by setting secrets now that the app exists:

   ```bash
   fly secrets set \
     BETTER_AUTH_SECRET="<openssl-rand-base64-32>" \
     DATABASE_AUTH_URL="libsql://<auth-db>.turso.io" \
     DATABASE_AUTH_SECRET="<token>" \
     DATABASE_URL="libsql://<documents-db>.turso.io" \
     DATABASE_TOKEN="<token>" \
     --app aipacto-server

   # None for web
   ```

   Adjust variable names and values per environment; see the Environment & Secrets section above for required keys.

3. Deploy using the config/Dockerfile pair for the service (see sections below).
   - Run these commands from the repository root. Launching from inside `apps/server` or `apps/web` makes Fly treat that folder as the root, so a Dockerfile like `apps/server/Dockerfile` ends up resolving to `apps/server/apps/server/Dockerfile` and the deploy fails.

4. Verify the rollout and machine health:

   ```bash
   fly status --app aipacto-server
   fly machines list --app aipacto-server
   fly status --app aipacto-web
   fly machines list --app aipacto-web
   ```

5. Inspect recent activity when debugging:

   ```bash
   fly logs --app aipacto-server
   fly logs --app aipacto-web
   ```

### Server (`@aipacto/apps-server`)

```bash
fly deploy \
  --config apps/server/fly.toml \
  --app aipacto-server
```

Useful commands:

- `fly status --app aipacto-server`
- `fly logs --app aipacto-server`
- `fly secrets list --app aipacto-server`

### Web (`@aipacto/apps-web`)

```bash
fly deploy \
  --config apps/web/fly.toml \
  --app aipacto-web
```

Useful commands mirror the server app (replace `--app`).

### Continuous Delivery

- Use `fly deploy --remote-only` if running on macOS/Windows without Linux toolchain.
- Allocate machines/IPs ahead of time if you need static addresses: `fly ips allocate-v4 --app <app>` and `fly ips allocate-v6 --app <app>`.

### Deploying `fly.toml`-only changes

When you edit only configuration inside `fly.toml` (machine sizing, env vars, restart policy, etc.) and do not need a new image build:

1. Inspect the image currently running in production:

   ```bash
   fly image show --app aipacto-server
   fly image show --app aipacto-web
   ```

   Note the `repository:tag` value reported for the active image.

2. Redeploy the configuration while pinning that image:

   ```bash
   fly deploy \
     --config apps/server/fly.toml \
     --image registry.fly.io/aipacto-server:<tag-from-step-1> \
     --app aipacto-server

   fly deploy \
     --config apps/web/fly.toml \
     --image registry.fly.io/aipacto-web:<tag-from-step-1> \
     --app aipacto-web
   ```

   This skips the build step entirely and reapplies the updated `fly.toml`. Add `--skip-release-command` if you need to bypass release hooks (e.g., migrations).

Re-run the commands above whenever you tweak configuration-only settings. If you later change application code, revert to a normal `fly deploy` without `--image` so a fresh build is produced.

## DNS & TLS (Cloudflare or other registrars)

1. List Fly IPs and hostnames:

   ```bash
   fly ips list --config apps/server/fly.toml
   fly ips list --config apps/web/fly.toml
   ```

2. In your DNS provider, create the records for `api.aipacto.com`, `aipacto.com`, and (optionally) `www.aipacto.com`. Choose the routing mode that matches your needs:

   **DNS-only (direct to Fly)**

   ```text
   api.aipacto.com   A     <Fly IPv4 for server>
   api.aipacto.com   AAAA  <Fly IPv6 for server>
   aipacto.com       A     <Fly IPv4 for web>
   aipacto.com       AAAA  <Fly IPv6 for web>
   www.aipacto.com   CNAME aipacto.com
   ```

   Pros:
   - End-to-end TLS terminates on Fly, so mutual TLS, HTTP/2, and HTTP/3 behave exactly as Fly documents.
   - No dependency on `X-Forwarded-For`/`CF-Connecting-IP`; your app sees client IPs directly.
   - Minimal latency and simpler observability—Fly logs and metrics reflect the real client exchanges.

   Cons:
   - No upstream shielding from DDoS or bot traffic beyond what Fly provides.
   - Static assets are served directly from Fly, so there is no caching layer in front of your app.

   **DNS with proxy/CDN in front of Fly**

   ```text
   api.aipacto.com   AAAA  <Fly IPv6 for server>
   aipacto.com       AAAA  <Fly IPv6 for web>
   www.aipacto.com   CNAME aipacto.com   # or provider-specific apex redirect
   ```

   Enable the proxy/CDN toggle in your provider so traffic terminates there before being forwarded to Fly. Follow the provider’s guidance for forwarding client IPs (`X-Forwarded-For`, `Forwarded`, or similar) and ensure your Fly app trusts those headers.

   Pros:
   - Gains WAF, DDoS mitigation, rate limiting, edge caching, and other CDN features.
   - Masks Fly’s IPv4 addresses and lets you rotate Fly machines without DNS changes.
   - Providers can negotiate protocols (e.g., HTTP/3) and ciphers independently of your origin.

   Cons:
   - Added latency and more moving parts; debugging requires tracing through the proxy layer.
   - You must rely on forwarded headers for real client IP visibility.
   - TLS termination happens twice, so misconfiguration can lead to mixed security modes (e.g., “Flexible SSL”).

3. Request Fly-managed TLS certificates once DNS is pointing at Fly and your records target the Fly IPs or the `*.fly.dev` hostnames:

   ```bash
   fly certs add api.aipacto.com --app aipacto-server
   fly certs add aipacto.com --app aipacto-web
   fly certs add www.aipacto.com --app aipacto-web
   ```

   Certificates transition to `Ready` after DNS validates. Monitor issuance status and DNS alignment:

   ```bash
   fly certs show api.aipacto.com --app aipacto-server
   fly certs show aipacto.com --app aipacto-web
   fly certs show www.aipacto.com --app aipacto-web
   fly certs check api.aipacto.com --app aipacto-server
   fly certs check aipacto.com --app aipacto-web
   fly certs check www.aipacto.com --app aipacto-web
   ```

4. Update application config to reflect production origins:
   - Server `ALLOWED_ORIGINS` must include `https://aipacto.com` (and `https://www.aipacto.com` if served).
   - Server auth cookies across apex + subdomain: set `BETTER_AUTH_COOKIE_DOMAIN=.aipacto.com` and `BETTER_AUTH_BASE_URL=https://api.aipacto.com`.
   - Web `VITE_SERVER_URL` should point to the API domain (e.g., `https://api.aipacto.com`), not the web domain.

### Notes for other DNS providers

- The same IP or CNAME approach works on Route 53, GCP, etc. Replace Cloudflare UI steps with the provider’s interface.
- Ensure TTLs are short (300s) during migration.
- If using a proxy CDN, expose the correct origin scheme (HTTPS) and pass through `CF-Connecting-IP`/`X-Forwarded-For` headers so the server sees client addresses.

## Troubleshooting

- Run `fly doctor` for CLI/environment issues.
- If deployments fail due to build cache, add `--no-cache` to `fly deploy`.
- Use `fly ssh console --app <app>` to inspect running machines (read-only container filesystem).
