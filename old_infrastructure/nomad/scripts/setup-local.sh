#!/bin/bash

# Setup local development environment for testing infrastructure

echo "🔧 Setting up local infrastructure testing environment..."

# Install Terraform
if ! command -v terraform &> /dev/null; then
    echo "Installing Terraform..."
    brew tap hashicorp/tap
    brew install hashicorp/tap/terraform
fi

# Install Nomad CLI
if ! command -v nomad &> /dev/null; then
    echo "Installing Nomad CLI..."
    brew tap hashicorp/tap
    brew install hashicorp/tap/nomad
fi

# Install Consul CLI
if ! command -v consul &> /dev/null; then
    echo "Installing Consul CLI..."
    brew tap hashicorp/tap
    brew install hashicorp/tap/consul
fi

# Install Hetzner CLI
if ! command -v hcloud &> /dev/null; then
    echo "Installing Hetzner Cloud CLI..."
    brew install hcloud
fi

echo "✅ Local setup complete!"
echo ""
echo "Next steps:"
echo "1. Create a Hetzner Cloud account: https://www.hetzner.com/cloud"
echo "2. Create an API token in the Hetzner Cloud Console"
echo "3. Export the token: export HCLOUD_TOKEN=your-token-here"
echo "4. Configure your domain DNS to point to the load balancer IP"
echo "5. Run: ./deploy.sh production plan"
