variable "project" {
  type        = string
  default     = "aipacto"
  description = "Project name"
}

variable "environment" {
  type        = string
  default     = "prod"
  description = "Environment name"
}

variable "domain" {
  type        = string
  default     = "aipacto.com"
  description = "Root domain managed in Cloudflare"
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare Zone ID for the domain"
}

variable "cloudflare_api_token" {
  type        = string
  sensitive   = true
  description = "Cloudflare API token with Zone:Read and DNS:Edit permissions for both Terraform and Caddy DNS challenges"
}

variable "hcloud_token" {
  type        = string
  sensitive   = true
  description = "Hetzner Cloud API token"
}

variable "server_type" {
  type        = string
  default     = "cx22"
  description = "Hetzner server type"
}

variable "location" {
  type        = string
  default     = "fsn1"
}

variable "image" {
  type        = string
  default     = "ubuntu-24.04"
}

variable "ssh_public_keys" {
  type        = list(string)
  description = "Hetzner SSH key names for server access"
  
  validation {
    condition     = length(var.ssh_public_keys) > 0
    error_message = "At least one SSH public key must be provided for server access."
  }
}

variable "ssh_public_key_content" {
  type        = string
  description = "Content of the SSH public key (e.g., from id_ed25519.pub)"

  validation {
    condition     = length(var.ssh_public_key_content) > 0 && startswith(var.ssh_public_key_content, "ssh-")
    error_message = "Invalid SSH key."
  }
}

variable "tailscale_authkey" {
  type        = string
  sensitive   = true
  description = "Tailscale reusable auth key (tags + SSH enabled)"
}

variable "tailscale_tags" {
  type        = string
  default     = "tag:prod"
}

variable "docker_namespace" {
  type        = string
  description = "Docker Hub namespace (e.g., developeraipacto)"
}


