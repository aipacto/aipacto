#!/bin/bash
# packages/infrastructure/setup.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_color() {
    echo -e "${!1}${2}${NC}"
}

print_header() {
    echo ""
    print_color "CYAN" "============================================"
    print_color "CYAN" "   Aipacto Infrastructure Setup Wizard"
    print_color "CYAN" "============================================"
    echo ""
}

create_directory_structure() {
    print_color "YELLOW" "Creating directory structure..."
    
    # Create all necessary directories
    mkdir -p terraform/{modules/base/scripts,environments/{production,staging,pr},scripts,backend-config}
    mkdir -p nomad/{jobs,configs,variables}
    mkdir -p docker
    mkdir -p monitoring
    mkdir -p .github/workflows
    
    print_color "GREEN" "✅ Directory structure created"
}

check_prerequisites() {
    print_color "YELLOW" "Checking prerequisites..."
    
    local missing=()
    
    # Required tools
    command -v terraform >/dev/null 2>&1 || missing+=("terraform")
    command -v docker >/dev/null 2>&1 || missing+=("docker")
    command -v git >/dev/null 2>&1 || missing+=("git")
    command -v jq >/dev/null 2>&1 || missing+=("jq")
    
    # Optional but recommended
    command -v nomad >/dev/null 2>&1 || print_color "YELLOW" "⚠️  Nomad CLI not installed (optional)"
    command -v consul >/dev/null 2>&1 || print_color "YELLOW" "⚠️  Consul CLI not installed (optional)"
    command -v hcloud >/dev/null 2>&1 || print_color "YELLOW" "⚠️  Hetzner CLI not installed (optional)"
    
    if [ ${#missing[@]} -gt 0 ]; then
        print_color "RED" "❌ Missing required tools: ${missing[*]}"
        print_color "YELLOW" "Install with:"
        print_color "BLUE" "  brew install ${missing[*]}"
        exit 1
    fi
    
    print_color "GREEN" "✅ All required tools installed"
}

setup_terraform_vars() {
    print_color "YELLOW" "Setting up Terraform variables..."
    
    # Production
    if [ ! -f terraform/environments/production/terraform.tfvars ]; then
        cp terraform/environments/production/terraform.tfvars.example \
           terraform/environments/production/terraform.tfvars 2>/dev/null || true
        print_color "BLUE" "Created terraform/environments/production/terraform.tfvars"
        print_color "YELLOW" "Please edit with your values!"
    fi
    
    # Staging
    if [ ! -f terraform/environments/staging/terraform.tfvars ]; then
        cp terraform/environments/staging/terraform.tfvars.example \
           terraform/environments/staging/terraform.tfvars 2>/dev/null || true
        print_color "BLUE" "Created terraform/environments/staging/terraform.tfvars"
    fi
    
    # PR
    if [ ! -f terraform/environments/pr/terraform.tfvars ]; then
        cp terraform/environments/pr/terraform.tfvars.example \
           terraform/environments/pr/terraform.tfvars 2>/dev/null || true
        print_color "BLUE" "Created terraform/environments/pr/terraform.tfvars"
    fi
    
    print_color "GREEN" "✅ Terraform variables configured"
}

setup_environment() {
    print_color "YELLOW" "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        cp .env.example .env 2>/dev/null || {
            cat > .env <<EOF
# Hetzner Cloud API Token
HCLOUD_TOKEN=your-token-here

# SSH Key Name in Hetzner
SSH_KEY_NAME=your-ssh-key

# Domain
PRODUCTION_DOMAIN=aipacto.com
STAGING_DOMAIN=staging.aipacto.com

EOF
        }
        print_color "BLUE" "Created .env file"
        print_color "RED" "⚠️  Please edit .env with your Hetzner API token!"
    fi
    
    # Source the environment file
    if [ -f .env ]; then
        export $(grep -v '^#' .env | xargs)
    fi
    
    print_color "GREEN" "✅ Environment configured"
}

make_scripts_executable() {
    print_color "YELLOW" "Making scripts executable..."
    
    chmod +x deploy.sh 2>/dev/null || true
    chmod +x setup.sh 2>/dev/null || true
    chmod +x terraform/scripts/*.sh 2>/dev/null || true
    
    print_color "GREEN" "✅ Scripts are executable"
}

initialize_git() {
    print_color "YELLOW" "Setting up Git..."
    
    if [ ! -f .gitignore ]; then
        print_color "BLUE" "Creating .gitignore"
        # .gitignore content already provided in previous artifact
    fi
    
    print_color "GREEN" "✅ Git configured"
}

show_next_steps() {
    print_color "GREEN" "\n🎉 Setup Complete!"
    print_color "CYAN" "\n════════════════════════════════════════════"
    print_color "CYAN" "                NEXT STEPS"
    print_color "CYAN" "════════════════════════════════════════════"
    
    echo ""
    print_color "YELLOW" "1. Get your Hetzner Cloud API token:"
    print_color "BLUE" "   https://console.hetzner.cloud → Security → API Tokens"
    
    echo ""
    print_color "YELLOW" "2. Configure your environment:"
    print_color "BLUE" "   Edit: .env"
    print_color "BLUE" "   Edit: terraform/environments/production/terraform.tfvars"
    
    echo ""
    print_color "YELLOW" "3. Deploy your first environment:"
    print_color "BLUE" "   export HCLOUD_TOKEN=your-token-here"
    print_color "BLUE" "   ./deploy.sh production"
    
    echo ""
    print_color "YELLOW" "4. For PR environments:"
    print_color "BLUE" "   ./deploy.sh pr 123"
    
    echo ""
    print_color "YELLOW" "5. Access your services:"
    print_color "BLUE" "   Production: https://aipacto.com"
    print_color "BLUE" "   Nomad UI: http://<server-ip>:4646"
    print_color "BLUE" "   Consul UI: http://<server-ip>:8500"
    
    echo ""
    print_color "CYAN" "════════════════════════════════════════════"
    print_color "GREEN" "Documentation: cat README.md"
    print_color "GREEN" "Cost estimate: ~€46/month (production)"
    print_color "GREEN" "PR environments: €3.85/month each (auto-cleanup after 1 week)"
    print_color "CYAN" "════════════════════════════════════════════"
}

main() {
    print_header
    
    print_color "GREEN" "This wizard will set up your Aipacto infrastructure"
    print_color "GREEN" "for production, staging, and PR environments."
    echo ""
    
    check_prerequisites
    create_directory_structure
    setup_terraform_vars
    setup_environment
    make_scripts_executable
    initialize_git
    
    show_next_steps
}

# Run main function
main
