terraform {
  required_version = ">= 1.13.0, < 2.0.0"

		required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.52.0"
    }
    cloudinit = {
      source  = "hashicorp/cloudinit"
      version = "~> 2.3.7"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
  }
  
  backend "s3" {
    # Dynamic backend config, set via CLI:
    # terraform init -backend-config="key=pr-${PR_NUMBER}/terraform.tfstate"
    bucket = "aipacto-terraform-state"
    region = "eu-central-1"
    use_path_style = true
    endpoints = {
      s3 = "https://fsn1.your-objectstorage.com"
    }
		skip_credentials_validation = true
		skip_metadata_api_check = true
		skip_region_validation = true
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

module "pr_environment" {
  source = "../../modules/base"
  
  project_name      = "aipacto"
  environment       = "pr"
  domain_name       = "pr-${var.pr_number}.pr.${var.base_domain_name}"
  is_pr_environment = true
  pr_number         = var.pr_number
  pr_ttl            = var.pr_ttl  # 168h = 1 week
  pr_allowed_ips    = var.dev_team_ips
  
  # Network configuration (use different range for isolation)
  network_ip_range = "10.${100 + (var.pr_number % 50)}.0.0/16"  # Dynamic per PR
  subnet_offset    = 1
  network_zone     = "eu-central"
  server_location  = var.server_location
  server_image     = "ubuntu-24.04"
  
  # SSH keys
  ssh_key_names = var.ssh_key_names
  
  # Security
  ssh_allowed_ips   = var.dev_team_ips
  
  # Software versions
  nomad_version  = "1.9.2"
  consul_version = "1.20.1"
  docker_version = "24.0.7"
  
  additional_labels = {
    cost_center = "engineering"
    team        = "platform"
    criticality = "low"
    github_actor = var.github_actor
    github_branch = var.github_branch
    github_sha = var.github_sha
  }
}

resource "null_resource" "deploy_pr" {
  depends_on = [module.pr_environment]
  
  provisioner "local-exec" {
    # Wait for Nomad to be ready
    command = <<-EOT
      for i in {1..30}; do
        curl -f http://${module.pr_environment.nomad_server_ips[0]}:4646/v1/status/leader && break
        sleep 10
      done
      NOMAD_ADDR=http://${module.pr_environment.nomad_server_ips[0]}:4646 \
        ${path.module}/../../scripts/deploy-nomad-jobs.sh pr ${var.pr_number} ${var.github_sha}
    EOT
  }
}

# Auto-cleanup notification
resource "null_resource" "cleanup_notification" {
  depends_on = [module.pr_environment]
  
  provisioner "local-exec" {
    command = <<-EOT
      echo "PR Environment #${var.pr_number} created"
      echo "Will auto-destroy at: $(date -d '+${var.pr_ttl}' '+%Y-%m-%d %H:%M:%S')"
      echo "URL: http://${module.pr_environment.load_balancer_ip}"
    EOT
  }
}

# Outputs
output "environment_url" {
  value = module.pr_environment.environment_url
  description = "PR environment URL"
}

output "nomad_ui_url" {
  value = module.pr_environment.nomad_ui_url
  description = "Nomad UI URL"
}

output "consul_ui_url" {
  value = module.pr_environment.consul_ui_url
  description = "Consul UI URL"
}

output "expires_at" {
  value = formatdate("YYYY-MM-DD hh:mm:ss", timeadd(timestamp(), var.pr_ttl))
  description = "When this PR environment will expire"
}

output "pr_info" {
  value = {
    pr_number     = var.pr_number
    url          = module.pr_environment.environment_url
    expires_at   = timeadd(timestamp(), var.pr_ttl)
    github_actor = var.github_actor
    github_branch = var.github_branch
  }
  description = "PR environment information"
}
