#!/bin/bash

set -e

export AWS_EC2_METADATA_DISABLED="${AWS_EC2_METADATA_DISABLED:-true}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/terraform"

print_color() {
    echo -e "${!1}${2}${NC}"
}

print_header() {
    echo ""
    print_color "BLUE" "======================================"
    print_color "BLUE" "  Aipacto Infrastructure Deployment"
    print_color "BLUE" "======================================"
    echo ""
}

check_requirements() {
    print_color "YELLOW" "Checking requirements..."
    
    local missing=()
    command -v terraform >/dev/null 2>&1 || missing+=("terraform")
    command -v docker >/dev/null 2>&1 || missing+=("docker")
    
    if [ ${#missing[@]} -gt 0 ]; then
        print_color "RED" "❌ Missing: ${missing[*]}"
        print_color "YELLOW" "Install with: brew install ${missing[*]}"
        exit 1
    fi
    
    if [ -z "$HCLOUD_TOKEN" ]; then
        print_color "RED" "❌ HCLOUD_TOKEN not set"
        print_color "YELLOW" "Get token from: https://console.hetzner.cloud"
        print_color "YELLOW" "Export: export HCLOUD_TOKEN=your-token"
        exit 1
    fi
    
    print_color "GREEN" "✅ All requirements met"
}

deploy_production() {
    print_color "GREEN" "🚀 Deploying Production..."
    cd "$TERRAFORM_DIR/environments/production"
    
    terraform init
    terraform plan -out=tfplan
    
    print_color "YELLOW" "Review the plan above. Deploy? (yes/no)"
    read -r confirm
    if [ "$confirm" == "yes" ]; then
        terraform apply tfplan
        print_color "GREEN" "✅ Production deployed!"
        print_color "BLUE" "URL: https://aipacto.com"
    fi
}

deploy_staging() {
    print_color "GREEN" "🚀 Deploying Staging..."
    cd "$TERRAFORM_DIR/environments/staging"
    
    terraform init
    terraform plan -out=tfplan
    terraform apply tfplan
    
    print_color "GREEN" "✅ Staging deployed!"
    print_color "BLUE" "URL: https://staging.aipacto.com"
}

deploy_pr() {
    local pr_number=$1
    if [ -z "$pr_number" ]; then
        print_color "RED" "❌ PR number required"
        exit 1
    fi
    
    print_color "GREEN" "🚀 Deploying PR #$pr_number..."
    cd "$TERRAFORM_DIR/environments/pr"
    
    export TF_VAR_pr_number=$pr_number
    export TF_VAR_github_actor="${GITHUB_ACTOR:-manual}"
    export TF_VAR_github_branch="${GITHUB_BRANCH:-pr-$pr_number}"
    
    terraform init -backend-config="key=pr-$pr_number/terraform.tfstate"
    terraform plan -out=tfplan
    terraform apply tfplan
    
    local url=$(terraform output -raw environment_url)
    local expires=$(terraform output -raw expires_at)
    
    print_color "GREEN" "✅ PR #$pr_number deployed!"
    print_color "BLUE" "URL: $url"
    print_color "YELLOW" "Expires: $expires (1 week)"
}

destroy_environment() {
    local env=$1
    local pr_number=$2
    
    print_color "YELLOW" "⚠️  Destroying $env environment..."
    
    if [ "$env" == "pr" ] && [ -z "$pr_number" ]; then
        print_color "RED" "❌ PR number required"
        exit 1
    fi
    
    cd "$TERRAFORM_DIR/environments/$env"
    
    if [ "$env" == "pr" ]; then
        export TF_VAR_pr_number=$pr_number
        terraform init -backend-config="key=pr-$pr_number/terraform.tfstate"
    else
        terraform init
    fi
    
    terraform destroy -auto-approve
    print_color "GREEN" "✅ $env environment destroyed"
}

list_environments() {
    print_color "GREEN" "📋 Active Environments:"
    echo ""
    
    if command -v hcloud >/dev/null 2>&1; then
        hcloud server list --selector project=aipacto
    else
        print_color "YELLOW" "Install hcloud CLI for detailed listing"
    fi
}

show_help() {
    print_header
    echo "Usage: ./deploy.sh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  production     Deploy production environment"
    echo "  staging        Deploy staging environment"
    echo "  pr <number>    Deploy PR environment"
    echo "  destroy <env>  Destroy environment (production|staging|pr)"
    echo "  list           List all environments"
    echo "  help           Show this help"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh production"
    echo "  ./deploy.sh pr 123"
    echo "  ./deploy.sh destroy pr 123"
    echo ""
}

# Main execution
main() {
    case "${1:-help}" in
        production)
            check_requirements
            deploy_production
            ;;
        staging)
            check_requirements
            deploy_staging
            ;;
        pr)
            check_requirements
            deploy_pr "$2"
            ;;
        destroy)
            check_requirements
            destroy_environment "$2" "$3"
            ;;
        list)
            list_environments
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_color "RED" "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

print_header
main "$@"
