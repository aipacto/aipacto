variable "hcloud_token" {
  description = "Hetzner Cloud API token"
  type        = string
  sensitive   = true
}

variable "base_domain_name" {
  description = "Base domain name (staging will be staging.domain)"
  type        = string
  default     = "aipacto.com"
}

variable "server_location" {
  description = "Server location"
  type        = string
  default     = "fsn1"
}

variable "ssh_key_names" {
  description = "SSH key names from Hetzner Cloud"
  type        = list(string)
  default     = []
}

variable "dev_team_ips" {
  description = "Development team IPs for access"
  type        = list(string)
  default     = [
    "203.0.113.0/32",  # Office IP
    "198.51.100.0/24"  # VPN range
  ]
}
