# Simple Hetzner + Cloudflare + Caddy Deployment

This stack provisions a single Hetzner VM, configures Tailscale, adds a Cloudflare DNS record, and boots a Docker Compose stack: Caddy (TLS), web, and server.

## Prerequisites

Before running Terraform, you'll need accounts and credentials from these services:

### Required Services & Credentials

1. **Hetzner Cloud**
   - API Token (for `hcloud_token` in terraform.tfvars)
   - SSH Key name (for `ssh_public_keys` in terraform.tfvars; used for initial root access fallback)
   - Object Storage: Create bucket (our case: `aipacto-terraform-state` as key in [simple/production/terraform.tfstate](./terraform/backend.tf)) and S3 credentials (access keys)
2. **Cloudflare**
   - Zone ID (for `cloudflare_zone_id` in terraform.tfvars)
   - API Token (for `cloudflare_api_token` in terraform.tfvars; used for both Terraform DNS updates and Caddy ACME DNS challenges)
3. **Tailscale**
   - Auth Key (for `tailscale_authkey` in terraform.tfvars)
   - ACL configuration (optional, for access control)
4. **Docker Hub** (optional, for custom images)
   - Username and token (for `docker_namespace` in terraform.tfvars)

### Configuration Values to Prepare

- Domain name (e.g., `aipacto.com`)
- Server type (e.g., `cx22`)
- Location (e.g., `fsn1`)
- Environment (e.g., `prod`)
- SSH public key content (for `ssh_public_key_content` in terraform.tfvars; paste the full content of your public key, e.g., from `cat ~/.ssh/id_ed25519_aipacto.pub`)

### Tailscale ACL Setup (Optional)

Configure access control for your Tailscale network. In Tailscale Admin Console → Access controls, use this example:

```json
{
  "grants": [
    {
      "src": ["*"],
      "dst": ["*"],
      "ip": ["*"]
    }
  ],
  "ssh": [
    {
      "action": "check",
      "src": ["autogroup:member"],
      "dst": ["autogroup:self"],
      "users": ["autogroup:nonroot", "root", "tsadmin"]
    },
    {
      "src": ["group:admins"],
      "dst": ["tag:prod"],
      "users": ["root", "tsadmin"],
      "action": "accept"
    }
  ],
  "tagOwners": {
    "tag:prod": ["autogroup:admin"]
  },
  "groups": {
    "group:admins": ["your-email@domain.com"]
  }
}
```

Replace `your-email@domain.com` with your actual email address.

## Terraform

Run from repo root:

```
cd infrastructure/simple/terraform
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values, including ssh_public_key_content

# Export the Hetzner S3 credentials
export AWS_ACCESS_KEY_ID="<HETZNER_ACCESS_KEY_ID>"
export AWS_SECRET_ACCESS_KEY="<HETZNER_SECRET_ACCESS_KEY>"

terraform init
terraform validate
terraform apply -auto-approve
```

## Test Connection

After Terraform completes, verify both direct SSH and Tailscale connections. Note: Direct root SSH may be available initially for emergencies, but is disabled post-cloud-init for security. Use the `tsadmin` user for access.

```bash
# Get the public IP from Terraform output
# Expected: Returns Hetzner public IPv4 address
PUBLIC_IP=$(terraform output -raw server_ipv4)

# Test direct SSH access via public IP
# Expected: Should connect without password and return "✅ Direct SSH working"
ssh tsadmin@$PUBLIC_IP 'echo "✅ Direct SSH working"'

# Check if the VM appears in your Tailscale network
# Expected: Should show aipacto-prod-vm-1 with status "online"
tailscale status

# Get the Tailscale IP of the VM
# Expected: Returns IPv4 address like 100.x.y.z
TS_IP=$(tailscale ip -4 aipacto-prod-vm-1)

# Test SSH access via Tailscale
# Expected: Should return "✅ Tailscale SSH working" without password prompt
tailscale ssh tsadmin@aipacto-prod-vm-1 'echo "✅ Tailscale SSH working"'

# Check Tailscale service status on the VM
# Expected: Should show "Active: active (running)" and "Main PID: <number>"
tailscale ssh tsadmin@aipacto-prod-vm-1 'sudo systemctl status tailscaled --no-pager'

# Verify Tailscale configuration and network info
# Expected: Should show JSON with Self.Online=true, Self.TailscaleIPs, etc.
tailscale ssh tsadmin@aipacto-prod-vm-1 'tailscale status --json | jq .'

# Check that the VM has the correct tags
# Expected: Should show configured tags like ["tag:prod"]
tailscale ssh tsadmin@aipacto-prod-vm-1 'tailscale status --json | jq ".Self.Tags"'
```

## Deploy with Dagger

Build and push immutable tags, then roll out via SSH (Tailscale IP recommended):

```
TAG="prod-$(git rev-parse --short HEAD)"
dagger call simple-deploy --build-and-push \
  --src "$(git rev-parse --show-toplevel)" \
  --docker-username "$DOCKERHUB_USERNAME" \
  --dockerhub-token env://DOCKERHUB_TOKEN \
  --docker-namespace developeraipacto \
  --tag "$TAG"
TS_IP=100.x.y.z
dagger call simple-deploy --deploy-via-ssh \
  --server-address "$TS_IP" \
  --ssh-private-key env://SSH_PRIVATE_KEY \
  --docker-namespace developeraipacto \
  --tag "$TAG"
```

Caddy auto-HTTPS is enabled via DNS challenge (using Cloudflare API token). This works with Cloudflare proxy enabled; no need for HTTP-01 or Origin Certs.
Notes:

- Docker Compose files are created during first-boot by cloud-init at `/opt/aipacto` so the VM comes up serving traffic without a manual SSH step.
- To change tags or images later, either redeploy with Dagger (recommended) or edit `/opt/aipacto/docker-compose.yml` and run `docker compose up -d`.
- IPv6 is enabled by default and an AAAA DNS record is created.
- Security: SSH is hardened (key-only, no root login). Rely on Hetzner Cloud Firewall for network protection; Fail2Ban and unattended-upgrades are enabled via cloud-init.
