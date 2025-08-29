variable "datacenter" {
  type = string
}

variable "namespace" {
  type = string
}

variable "environment" {
  type = string
}

variable "version" {
  type = string
}

variable "image_tag" {
  type = string
}

variable "server_count" {
  type = number
}

variable "server_cpu" {
  type = number
}

variable "server_memory" {
  type = number
}

variable "log_level" {
  type    = string
  default = "info"
}

variable "db_password" {
  type    = string
  default = ""
}

job "aipacto-server" {
  datacenters = [var.datacenter]
  type        = "service"
  namespace   = var.namespace

  meta {
    version = var.version
  }

  update {
    max_parallel      = 1
    min_healthy_time  = "30s"
    healthy_deadline  = "5m"
    progress_deadline = "10m"
    auto_revert       = true
    auto_promote      = true
    canary            = 1
  }

  group "server" {
    count = var.server_count

    restart {
      attempts = 3
      interval = "5m"
      delay    = "30s"
      mode     = "delay"
    }

    network {
      port "http" {
        to = 3000
      }
    }

    service {
      name = "aipacto-server"
      port = "http"
      tags = ["api", var.environment]

      check {
        name     = "HTTP Health"
        type     = "http"
        path     = "/health"
        interval = "10s"
        timeout  = "2s"
      }

      connect {
        sidecar_service {}
      }
    }

    task "server" {
      driver = "docker"

      config {
        image = "developeraipacto/aipacto-server:${var.image_tag}"
        ports = ["http"]

        logging {
          type = "json-file"
          config {
            max-size  = "10m"
            max-files = "3"
          }
        }
      }

      env {
        NODE_ENV  = var.environment
        PORT      = "3000"
        LOG_LEVEL = var.log_level
      }

      # Render runtime env vars from Consul/Vault context
      template {
        destination = "secrets/env.vars"
        env         = true
        data        = <<EOF
{{- range service "postgres.${var.namespace}" }}
DATABASE_URL=postgresql://aipacto:${var.db_password}@{{ .Address }}:{{ .Port }}/aipacto_${var.environment}
{{- end }}
{{- with secret "kv/data/aipacto/${var.environment}" }}
LANGCHAIN_API_KEY={{ .Data.data.langchain_api_key }}
JWT_SECRET={{ .Data.data.jwt_secret }}
SESSION_SECRET={{ .Data.data.session_secret }}
{{- end }}
EOF
      }

      resources {
        cpu    = var.server_cpu
        memory = var.server_memory
      }

      kill_timeout = "30s"
    }
  }
}
