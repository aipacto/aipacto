variable "datacenter" {
  type = string
}

variable "namespace" {
  type = string
}

variable "environment" {
  type = string
}

variable "caddy_count" {
  type    = number
  default = 1
}

variable "image_tag" {
  type = string
}

job "caddy" {
  datacenters = [var.datacenter]
  type        = "service"
  namespace   = var.namespace
  
  constraint {
    operator = "distinct_hosts"
    value    = true
  }

	group "caddy" {
		# In production set via var-file to match your client count (e.g., 3)
		count = var.caddy_count

		# Host networking so Caddy binds :80/:443 on the host
		network {
			mode = "host"
			port "http"  { static = 80 }
			port "https" { static = 443 }
			port "admin" { to = 2019 }
		}

		service {
			name = "caddy"
			port = "http"
			tags = ["lb", "ingress", var.environment]

			check {
				name     = "Admin Health"
				type     = "http"
				path     = "/health"
				port     = "admin"
				interval = "10s"
				timeout  = "2s"
			}
		}

		task "caddy" {
			driver = "docker"
			config {
				image       = "caddy:2-alpine"
				# Important: use Consul DNS so *.service.consul resolves inside container
				dns_servers = ["127.0.0.1:8600"]
				ports       = ["http", "https", "admin"]

				volumes = [
					"local/Caddyfile:/etc/caddy/Caddyfile",
					"alloc/data:/data",
					"alloc/config:/config"
				]

				logging {
					type = "json-file"

					config {
						max-size = "10m"
						max-files = "3"
					}
				}
			}

			template {
				destination = "local/Caddyfile"
				change_mode = "restart"
				# Reads one of: Caddyfile.production | Caddyfile.staging | Caddyfile.pr
				data        = file("../configs/Caddyfile.${var.environment}")
			}

			resources {
				cpu = 200
				memory = 256
			}

			kill_timeout = "30s"
		}
	}
}
