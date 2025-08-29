variable "hcloud_token" {
  description = "Hetzner Cloud API token"
  type        = string
  sensitive   = true
}

variable "pr_number" {
  description = "Pull request number"
  type        = number
}

variable "pr_ttl" {
  description = "Time to live for PR environment"
  type        = string
  default     = "168h"  # 1 week
}

variable "base_domain_name" {
  description = "Base domain name"
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
  default     = ["0.0.0.0/0", "::/0"]  # Update with your team IPs
}

variable "github_actor" {
  description = "GitHub user who created the PR"
  type        = string
  default     = ""
}

variable "github_branch" {
  description = "Git branch name"
  type        = string
  default     = ""
}

variable "github_sha" {
  description = "Git commit SHA"
  type        = string
  default     = "latest"
}
