variable "hcloud_token" {
  description = "Hetzner Cloud API token"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Production domain name"
  type        = string
  default     = "aipacto.com"
}

variable "server_location" {
  description = "Server location"
  type        = string
  default     = "fsn1" # Falkenstein, Germany
}

variable "ssh_key_names" {
  description = "SSH key names from Hetzner Cloud"
  type        = list(string)
  default     = [] # Add your SSH key names here
}

variable "ssh_allowed_ips" {
  description = "IPs allowed to SSH"
  type        = list(string)
  default     = [] # when ssh_exposed=false, this can be empty

  validation {
    condition     = (!var.ssh_exposed) || (length(var.ssh_allowed_ips) > 0 && !contains(var.ssh_allowed_ips, "0.0.0.0/0"))
    error_message = "When ssh_exposed=true, ssh_allowed_ips must be set and cannot be 0.0.0.0/0."
  }
}

# variable "admin_allowed_ips" {
#   description = "IPs allowed to access Nomad/Consul UI"
#   type        = list(string)
#   default     = ["0.0.0.0/0", "::/0"] # RESTRICT THIS IN PRODUCTION!
# }

variable "ssl_certificates" {
  description = "SSL certificate IDs (if using Hetzner certificates)"
  type        = list(string)
  default     = []
}

variable "ssh_exposed" {
  description = "Expose public SSH (port 22) via firewall"
  type        = bool
  default     = false
}

variable "tailscale_auth_key" {
  description = "Tailscale auth key"
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
  description = "Tags for Tailscale nodes"
  type        = list(string)
  default     = ["tag:prod"]
}

variable "tailscale_hostname_prefix" {
  description = "Hostname prefix for Tailscale nodes"
  type        = string
  default     = "aipacto"
}

