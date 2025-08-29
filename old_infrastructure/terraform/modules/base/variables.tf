variable "project_name" {
  type    = string
  default = "aipacto"
}

variable "environment" {
  type        = string
  description = "Environment name (production, staging, pr)"
}

variable "domain_name" {
  type        = string
  description = "Domain name for the environment"
}

variable "is_pr_environment" {
  type    = bool
  default = false
}

variable "pr_number" {
  type    = number
  default = 0
}

variable "pr_ttl" {
  type    = string
  default = "168h"  # 1 week
}

variable "pr_allowed_ips" {
  type    = list(string)
  default = ["0.0.0.0/0", "::/0"]  # Change to restrict PR access
}

variable "ssh_allowed_ips" {
  type    = list(string)
  default = ["0.0.0.0/0", "::/0"]  # CHANGE IN PRODUCTION
}

# variable "admin_allowed_ips" {
#   type    = list(string)
#   default = ["0.0.0.0/0", "::/0"]
# }

variable "network_ip_range" {
  type    = string
  default = "10.0.0.0/16"
}

variable "subnet_offset" {
  type        = number
  default     = 1
  description = "Subnet offset for different environments"
}

variable "network_zone" {
	type = string
	default = "eu-central"
	validation {
		condition = contains(["eu-central", "us-east", "us-west", "ap-southeast"], var.network_zone)
		error_message = "network_zone must be one of: eu-central, us-east, us-west, ap-southeast."
	}
}

variable "server_location" {
  type    = string
  default = "fsn1"
}

variable "server_image" {
  type    = string
  default = "ubuntu-24.04"
}

variable "ssh_key_names" {
  type        = list(string)
  description = "Names of SSH keys in Hetzner Cloud"
  default     = []
}

variable "ssl_certificates" {
  type    = list(string)
  default = []
}

variable "nomad_version" {
  type    = string
  default = "1.10.4"
}

variable "consul_version" {
  type    = string
  default = "1.21.4"
}

variable "docker_version" {
  type    = string
  default = "24.0.7"
}

variable "additional_labels" {
  type    = map(string)
  default = {}
}

variable "ssh_exposed" {
  description = "Whether to expose public SSH (port 22) at the Hetzner firewall"
  type        = bool
  default     = false
}

variable "tailscale_auth_key" {
  description = "Ephemeral/auth key from Tailscale Admin (use a reusable or ephemeral key)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "tailscale_enable_ssh" {
  description = "Enable Tailscale SSH"
  type        = bool
  default     = true
}

variable "tailscale_tags" {
  description = "Tailscale node tags to advertise (e.g., [\"tag:prod\"])"
  type        = list(string)
  default     = []
}

variable "tailscale_hostname_prefix" {
  description = "Prefix for Tailscale node hostname"
  type        = string
  default     = "aipacto"
}
