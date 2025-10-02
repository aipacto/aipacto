# Unikraft Cloud Deployment

This directory contains the Unikraft Cloud deployment configuration for Aipacto.

## Architecture

- **Web Service (Node SSR)**: Serves the built web app (TanStack SSR). Publicly exposed on port 443 → 3000.
- **Server Service (Node)**: Handles API requests and business logic. Internal-only; not publicly exposed.

## Services

### Web Service

- Runtime: Caddy
- Port: 2015 (mapped to 443 externally)
- Static files served from `/var/www`
- Reverse proxy for `/api/*` routes to server service

### Server Service

- Runtime: Node.js 24
- Port: 3000 (internal only)
- Handles API routes under `/api` prefix
- Database: LibSQL with Kysely (compatible with Turso for production)

## Deployment

### Prerequisites

1. Install the `kraft` CLI:

   ```bash
   curl -sSfL https://get.kraftkit.sh | sh
   ```

2. Set Unikraft Cloud constants:

   ```bash
   # Set Unikraft Cloud access token
   export UKC_TOKEN=your-token-here

   # Set Unikraft Cloud region, fra0, nrt1, etc.
   export UKC_METRO=<your-region>
   ```

3. Copy environment file:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Test Locally with Docker

Before deploying to Unikraft Cloud, test the server locally:

```bash
# From the monorepo root

# Build the test Docker image
docker build -f Dockerfile.server.test -t aipacto-server:test .

# Run the server locally (foreground)
docker run --rm -p 3000:3000 aipacto-server:test

# Or run in background
docker run -d --name aipacto-server-test -p 3000:3000 aipacto-server:test

# Test the health endpoint
curl http://localhost:3000/api/health

# Stop the running container
docker stop aipacto-server-test
docker rm aipacto-server-test
```

### Deploy to Unikraft Cloud

After the refactor, Dockerfiles live at the monorepo root and we deploy from the repo root while referencing each service's Kraftfile.

```bash
# From the monorepo root

# Deploy Web
kraft cloud deploy \
  --kraftfile infrastructure/kraftcloud/web/Kraftfile \
  -p 443:3000 \
  .

# Deploy Server
kraft cloud deploy \
  --kraftfile infrastructure/kraftcloud/server/Kraftfile \
  -M 2G \
  .
```

### DNS Configuration

Before deploying with a custom domain, configure your DNS provider according to the [Unikraft Cloud domains documentation](https://unikraft.com/docs/platform/domains):

**For subdomains** (e.g., `xyz.aipacto.com`):

- Add a CNAME record: `xyz` → `fra0.kraft.host`

**For apex domains** (e.g., `aipacto.com`):

- Add an ALIAS, ANAME, or flattened CNAME record pointing to `fra0.kraft.host`
- If your DNS provider doesn't support ALIAS/ANAME, add an A record pointing to the metro IP address
- Get metro IP addresses with: `kraft cloud metro ls`

### Custom Domains

To associate a custom domain (e.g., `aipacto.com`) with your deployment, use the `--domain` flag during deployment. Unikraft Cloud handles automatic HTTPS/TLS for custom domains.

- For the web service (public-facing):

  ```bash
  # From repo root
  kraft cloud deploy \
    --kraftfile infrastructure/kraftcloud/web/Kraftfile \
    --metro fra0 \
    -p 443:3000 \
    --domain aipacto.com \
    .
  ```

  - Use `--subdomain strings` for subdomains (e.g., `--subdomain api` for `api.aipacto.com`).
  - If using a custom TLS certificate, add `--certificate path/to/cert` (optional; auto-TLS is default).

After deployment, the command outputs the service's fully qualified domain name (FQDN), e.g., `your-service.fra0.kraft.host`.

Allow time for DNS propagation (typically minutes to hours). Access your app at `https://aipacto.com`.

Check certificate validation status with: `kraft cloud cert get`

### Environment Variables

Configure your services via `.env` file:

- `DATABASE_URL`: LibSQL connection string (file: for dev, libsql:// for Turso)
- `DATABASE_TOKEN`: Turso authentication token (production only)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
- `BETTER_AUTH_SECRET`: Secret key for Better Auth
- `BETTER_AUTH_URL`: Base URL for authentication
- `VITE_SERVER_URL`: Frontend API endpoint URL
- `SERVER_HOST`: Server bind address (default: 0.0.0.0)
- `PORT`: Server port (default: 3000)

## Troubleshooting

### Docker Testing

If the Docker test fails with module resolution errors:

```bash
# Check if workspace packages are copied correctly
docker run --rm aipacto-server:test ls -la /usr/src/app/node_modules/@aipacto/

# Inspect the container's file structure
docker run --rm -it aipacto-server:test /bin/sh
```

### Unikraft Cloud Logs

View instance logs (replace <instance-name> with the name shown after deploy):

```bash
kraft cloud instance logs <instance-name>
```

### Scale-to-Zero

Both services are configured with scale-to-zero:

- Web: 1s cooldown, stateless
- Server: 1s cooldown, stateless

## References

- [Unikraft Cloud Documentation](https://unikraft.cloud/docs/)
- [Kraft CLI Reference](https://unikraft.org/docs/cli/)
- [Caddy Documentation](https://caddyserver.com/docs/)
- [Node.js on Unikraft](https://unikraft.cloud/docs/)
