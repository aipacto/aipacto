# Dagger Infrastructure

This directory contains the Dagger pipeline for deploying Aipacto infrastructure.

## Usage

1. Set the following environment variables

```sh
export DOCKERHUB_TOKEN="your-dockerhub-token"
export HCLOUD_TOKEN="your-hetzner-cloud-api-token"
export AWS_ACCESS_KEY_ID="your-aws-access-key"  # For S3 Terraform state storage only
export AWS_SECRET_ACCESS_KEY="your-aws-secret-key"  # For S3 Terraform state storage only
export NOMAD_TOKEN="your-nomad-token"
export TAILSCALE_AUTH_KEY="tskey-auth-XXXX"
```

2. Deploy to production

```sh
dagger call prod-deploy \
  --src "$(git rev-parse --show-toplevel)" \
  --docker-username "your-username" \
  --docker-token env://DOCKERHUB_TOKEN \
  --ssh-key-name "your-ssh-key" \
  --hcloud-token env://HCLOUD_TOKEN \
  --aws-access-key-id env://AWS_ACCESS_KEY_ID \
  --aws-secret-access-key env://AWS_SECRET_ACCESS_KEY \
  --nomad-addr "http://your-server:4646" \
  --nomad-token env://NOMAD_TOKEN \
  --prod-domain "aipacto.com" \
  --sha "$(git rev-parse HEAD)"
```

## What it does

The `prod-deploy` function:

1. **Builds and publishes** Docker images for server and web applications
2. **Applies Terraform** configuration to provision infrastructure
3. **Deploys to Nomad** cluster
4. **Performs health checks** to ensure deployment success

## Prerequisites

- Dagger CLI installed and running
- All required environment variables set
- Access to Docker Hub, Hetzner Cloud, AWS S3 (for Terraform state), and Nomad

## Infrastructure Details

- **Hosting**: Hetzner Cloud (servers, networking)
- **Container Registry**: Docker Hub
- **Orchestration**: Nomad
- **Terraform State**: AWS S3 (remote state storage only)
- **Optional**: Tailscale VPN
