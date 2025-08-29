# Variables
SHELL := /bin/bash
.DEFAULT_GOAL := help
PR_NUMBER ?= $(shell git rev-parse --short HEAD)
ENVIRONMENT ?= production

# Colors
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m

.PHONY: help
help: ## Show this help message
	@echo -e "$(BLUE)Aipacto Infrastructure Management$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

.PHONY: check
check: ## Check prerequisites
	@echo -e "$(YELLOW)Checking prerequisites...$(NC)"
	@command -v terraform >/dev/null 2>&1 || { echo -e "$(RED)❌ Terraform not installed$(NC)"; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo -e "$(RED)❌ Docker not installed$(NC)"; exit 1; }
	@command -v nomad >/dev/null 2>&1 || { echo -e "$(YELLOW)⚠️  Nomad CLI not installed (optional)$(NC)"; }
	@command -v consul >/dev/null 2>&1 || { echo -e "$(YELLOW)⚠️  Consul CLI not installed (optional)$(NC)"; }
	@[ ! -z "$$HCLOUD_TOKEN" ] || { echo -e "$(RED)❌ HCLOUD_TOKEN not set$(NC)"; exit 1; }
	@echo -e "$(GREEN)✅ All requirements met$(NC)"

# === Terraform Commands ===

.PHONY: tf-init
tf-init: ## Initialize Terraform
	@cd terraform/environments/$(ENVIRONMENT) && terraform init

.PHONY: tf-plan
tf-plan: check ## Plan infrastructure changes
	@cd terraform/environments/$(ENVIRONMENT) && terraform plan -out=tfplan

.PHONY: tf-apply
tf-apply: check ## Apply infrastructure changes
	@cd terraform/environments/$(ENVIRONMENT) && terraform apply tfplan

.PHONY: tf-destroy
tf-destroy: check ## Destroy infrastructure
	@echo -e "$(RED)⚠️  WARNING: This will destroy $(ENVIRONMENT) infrastructure$(NC)"
	@read -p "Are you sure? (yes/no): " confirm && [ "$$confirm" = "yes" ] || exit 1
	@cd terraform/environments/$(ENVIRONMENT) && terraform destroy -auto-approve

.PHONY: tf-fmt
tf-fmt: ## Format Terraform files
	@terraform fmt -recursive terraform/

.PHONY: tf-validate
tf-validate: ## Validate Terraform configuration
	@cd terraform/environments/$(ENVIRONMENT) && terraform validate

# === Docker Commands ===

.PHONY: docker-build
docker-build: ## Build Docker images
	@echo -e "$(YELLOW)Building Docker images...$(NC)"
		@docker build -f docker/server.Dockerfile -t developeraipacto/aipacto-server:local ../..
	@docker build -f docker/web.Dockerfile -t developeraipacto/aipacto-web:local ../..
	@echo -e "$(GREEN)✅ Images built$(NC)"

.PHONY: docker-push
docker-push: ## Push Docker images
	@echo -e "$(YELLOW)Pushing Docker images...$(NC)"
	@docker push developeraipacto/aipacto-server:latest
	@docker push developeraipacto/aipacto-web:latest
	@echo -e "$(GREEN)✅ Images pushed$(NC)"

.PHONY: docker-run-local
docker-run-local: ## Run local Docker environment
	@docker-compose up -d
	@echo -e "$(GREEN)✅ Local environment running$(NC)"
	@echo -e "$(BLUE)Web: http://localhost$(NC)"
	@echo -e "$(BLUE)API: http://localhost:3000$(NC)"
	@echo -e "$(BLUE)Nomad: http://localhost:4646$(NC)"
	@echo -e "$(BLUE)Consul: http://localhost:8500$(NC)"

.PHONY: docker-stop-local
docker-stop-local: ## Stop local Docker environment
	@docker-compose down
	@echo -e "$(GREEN)✅ Local environment stopped$(NC)"

# === Deployment Commands ===

.PHONY: deploy-production
deploy-production: check ## Deploy to production
	@./deploy.sh production

.PHONY: deploy-staging
deploy-staging: check ## Deploy to staging
	@./deploy.sh staging

.PHONY: deploy-pr
deploy-pr: check ## Deploy PR environment
	@./deploy.sh pr $(PR_NUMBER)

.PHONY: destroy-pr
destroy-pr: check ## Destroy PR environment
	@./deploy.sh destroy pr $(PR_NUMBER)

# === Environment Management ===

.PHONY: list-envs
list-envs: ## List all environments
	@hcloud server list --selector project=aipacto -o columns=name,server_type,status,ipv4,labels

.PHONY: cleanup-prs
cleanup-prs: ## Cleanup expired PR environments
	@echo -e "$(YELLOW)Cleaning up expired PR environments...$(NC)"
	@hcloud server list -o json | jq -r '.[] | select(.labels.ephemeral == "true") | select((now - (.created | fromdate)) > 604800) | .name' | xargs -I {} hcloud server delete {} || true
	@echo -e "$(GREEN)✅ Cleanup complete$(NC)"

# === Nomad Commands ===

.PHONY: nomad-status
nomad-status: ## Show Nomad cluster status
	@nomad server members
	@nomad node status

.PHONY: nomad-jobs
nomad-jobs: ## List Nomad jobs
	@nomad job status

.PHONY: nomad-ui
nomad-ui: ## Open Nomad UI
	@open http://$$(cd terraform/environments/$(ENVIRONMENT) && terraform output -raw nomad_ui_url)

# === Consul Commands ===

.PHONY: consul-members
consul-members: ## Show Consul members
	@consul members

.PHONY: consul-services
consul-services: ## List Consul services
	@consul catalog services

.PHONY: consul-ui
consul-ui: ## Open Consul UI
	@open http://$$(cd terraform/environments/$(ENVIRONMENT) && terraform output -raw consul_ui_url)

# === Utility Commands ===

.PHONY: ssh-server
ssh-server: ## SSH to first server
	@ssh root@$$(cd terraform/environments/$(ENVIRONMENT) && terraform output -json nomad_server_ips | jq -r '.[0]')

.PHONY: logs
logs: ## Show application logs
	@nomad alloc logs -tail -f $$(nomad job status aipacto-server | grep running | head -1 | awk '{print $$1}')

.PHONY: cost
cost: ## Show cost estimate
	@echo -e "$(BLUE)Monthly Cost Estimate:$(NC)"
	@echo "Production: €46/month (3x cx32)"
	@echo "Staging: €12/month (1x cx22)"
	@echo "PR (each): €3.85/month (1x cx11)"
	@echo -e "$(YELLOW)Total: ~€58-70/month$(NC)"

.PHONY: clean
clean: ## Clean temporary files
	@rm -rf terraform/*/.terraform
	@rm -f terraform/*/tfplan
	@rm -f terraform/*/*.tfstate*
	@echo -e "$(GREEN)✅ Cleaned$(NC)"

# === Testing Commands ===

.PHONY: test-local
test-local: docker-run-local ## Test in local environment
	@echo -e "$(YELLOW)Running tests...$(NC)"
	@sleep 10
	@curl -f http://localhost/health || { echo -e "$(RED)❌ Web health check failed$(NC)"; exit 1; }
	@curl -f http://localhost:3000/health || { echo -e "$(RED)❌ API health check failed$(NC)"; exit 1; }
	@echo -e "$(GREEN)✅ All health checks passed$(NC)"

.PHONY: test-production
test-production: ## Test production environment
	@curl -f https://aipacto.com/health || { echo -e "$(RED)❌ Production health check failed$(NC)"; exit 1; }
	@echo -e "$(GREEN)✅ Production is healthy$(NC)"
