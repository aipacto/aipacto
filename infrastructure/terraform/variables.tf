variable "hcloud_token" {
  type        = string
  description = "Hetzner Cloud API token"
  sensitive   = true
}

variable "location" {
  type        = string
  default     = "fsn1"
  description = "Hetzner location: fsn1, nbg1, hel1, ash, hil"
}

variable "server_type" {
  type        = string
  default     = "cx22"
  description = "Hetzner server type for both CP and workers"
}

variable "image" {
  type    = string
  default = "ubuntu-24.04"
}

variable "node_count" {
  type        = number
  default     = 2
  description = "Worker count"
}

variable "tailscale_authkey" {
  type        = string
  sensitive   = true
  description = "Reusable Tailscale auth key with tags and SSH enabled"
}

variable "tailscale_tags" {
  type        = string
  default     = "tag:prod"
  description = "Comma-separated tags to advertise to Tailscale"
}

variable "ssh_public_keys" {
  type        = list(string)
  default     = []
  description = "Hetzner SSH key names to inject (optional, TS-SSH is primary)"
}

variable "network_cidr" {
  type    = string
  default = "10.10.0.0/16"
}

variable "subnet_cidr" {
  type    = string
  default = "10.10.1.0/24"
}

variable "project_name" {
  type        = string
  default     = "aipacto"
  description = "Project name for resource naming"
}

variable "environment" {
  type        = string
  default     = "prod"
  description = "Environment name (prod, staging, dev, etc.)"
}

variable "enable_ipv6" {
  type    = bool
  default = false
}
