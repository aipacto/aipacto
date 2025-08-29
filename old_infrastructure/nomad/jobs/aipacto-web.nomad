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

variable "web_count" {
  type = number
}

variable "web_cpu" {
  type = number
}

variable "web_memory" {
  type = number
}

variable "api_url" {
  type = string
}

job "aipacto-web" {
  datacenters = [var.datacenter]
  type        = "service"
  namespace   = var.namespace

  meta {
    version = var.version
  }

  update {
    max_parallel      = 2
    min_healthy_time  = "30s"
    healthy_deadline  = "5m"
    progress_deadline = "10m"
    auto_revert       = true
    auto_promote      = true
    canary            = 1
  }

  group "web" {
    count = var.web_count

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
      name = "aipacto-web"
      port = "http"
      tags = ["frontend", var.environment]

      check {
        name     = "HTTP Health"
        type     = "http"
        path     = "/"
        interval = "10s"
        timeout  = "2s"
      }
    }

    task "web" {
      driver = "docker"

      config {
        image = "developeraipacto/aipacto-web:${var.image_tag}"
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
        NODE_ENV = var.environment
        PORT     = "3000"
        API_URL  = var.api_url
      }

      resources {
        cpu    = var.web_cpu
        memory = var.web_memory
      }

      kill_timeout = "10s"
    }
  }
}
