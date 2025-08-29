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
    bucket         = "aipacto-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "eu-central-1" # Just a placeholder, not used with Hetzner
    use_path_style = true
    endpoints = {
      s3 = "https://fsn1.your-objectstorage.com"
    }
    skip_credentials_validation = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_s3_checksum            = true
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

module "production" {
  source = "../../modules/base"

  project_name      = "aipacto"
  environment       = "production"
  domain_name       = var.domain_name
  is_pr_environment = false

  # Network configuration
  network_ip_range = "10.0.0.0/16"
  subnet_offset    = 1
  network_zone     = "eu-central"
  server_location  = var.server_location
  server_image     = "ubuntu-24.04"

  # SSH keys
  ssh_key_names = var.ssh_key_names


  # SSL certificates (if managed externally)
  ssl_certificates = var.ssl_certificates

  # Software versions
  nomad_version  = "1.9.2"
  consul_version = "1.20.1"
  docker_version = "24.0.7"

  additional_labels = {
    cost_center = "engineering"
    team        = "platform"
    criticality = "high"
  }

  # SSH exposure & allow-list
  ssh_exposed       = var.ssh_exposed
  ssh_allowed_ips   = var.ssh_allowed_ips
  # admin_allowed_ips = var.admin_allowed_ips

  # Tailscale
  tailscale_auth_key        = var.tailscale_auth_key
  tailscale_enable_ssh      = var.tailscale_enable_ssh
  tailscale_tags            = var.tailscale_tags
  tailscale_hostname_prefix = var.tailscale_hostname_prefix
}

# Outputs
output "load_balancer_ip" {
  value       = module.production.load_balancer_ip
  description = "Production load balancer IP - Point your domain A record here"
}

output "nomad_ui_url" {
  value       = module.production.nomad_ui_url
  description = "Nomad UI URL"
}

output "consul_ui_url" {
  value       = module.production.consul_ui_url
  description = "Consul UI URL"
}

output "environment_url" {
  value       = module.production.environment_url
  description = "Production environment URL"
}

output "ssh_connect" {
  value = {
    nomad_server = "ssh root@${module.production.nomad_server_ips[0]}"
    nomad_client = "ssh root@${module.production.nomad_client_ips[0]}"
  }
  description = "SSH connection strings"
}

output "nomad_server_ips" {
  value       = module.production.nomad_server_ips
  description = "Nomad server IPs"
}

output "deploy_command" {
  value       = "NOMAD_ADDR=http://${module.production.nomad_server_ips[0]}:4646 ./terraform/scripts/deploy-nomad-jobs.sh production"
  description = "Command to deploy applications"
}
