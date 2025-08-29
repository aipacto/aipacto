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
    bucket = "aipacto-terraform-state"
    key    = "staging/terraform.tfstate"
    region = "eu-central-1"
		use_path_style = true
    endpoints = {
      s3 = "https://fsn1.your-objectstorage.com"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

module "staging" {
  source = "../../modules/base"
  
  project_name      = "aipacto"
  environment       = "staging"
  domain_name       = "staging.${var.base_domain_name}"
  is_pr_environment = false
  
  # Network configuration (different subnet from production)
  network_ip_range = "10.1.0.0/16"
  subnet_offset    = 1
  network_zone     = "eu-central"
  server_location  = var.server_location
  server_image     = "ubuntu-24.04"
  
  # SSH keys
  ssh_key_names = var.ssh_key_names
  
  # Security (more relaxed than production for testing)
  ssh_allowed_ips   = var.dev_team_ips
  # admin_allowed_ips = var.dev_team_ips
  
  # Software versions (can test newer versions here)
  nomad_version  = "1.9.2"
  consul_version = "1.20.1"
  docker_version = "24.0.7"
  
  additional_labels = {
    cost_center = "engineering"
    team        = "platform"
    criticality = "medium"
  }
}

# Outputs for PR environments to reference
output "consul_servers" {
  value = module.staging.nomad_server_ips
  description = "Consul servers for PR environments to join"
}

output "network_id" {
  value = module.staging.network_id
  description = "Network ID for shared infrastructure"
}

output "load_balancer_ip" {
  value = module.staging.load_balancer_ip
  description = "Staging load balancer IP"
}

output "nomad_ui_url" {
  value = module.staging.nomad_ui_url
  description = "Nomad UI URL"
}

output "consul_ui_url" {
  value = module.staging.consul_ui_url
  description = "Consul UI URL"
}

output "environment_url" {
  value = module.staging.environment_url
  description = "Staging environment URL"
}
