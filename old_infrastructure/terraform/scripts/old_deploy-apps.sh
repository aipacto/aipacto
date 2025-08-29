#!/bin/bash

set -e

ENVIRONMENT=$1
PR_NUMBER=${2:-""}
IMAGE_TAG=${3:-"latest"}

echo "Deploying applications to $ENVIRONMENT"

# Determine the Nomad namespace
NAMESPACE=$ENVIRONMENT
if [ "$ENVIRONMENT" == "pr" ]; then
  NAMESPACE="pr-$PR_NUMBER"
  IMAGE_TAG="pr-$PR_NUMBER"
fi

# Wait for Nomad to be ready
echo "Waiting for Nomad..."
for i in {1..30}; do
  if nomad server members 2>/dev/null | grep -q alive; then
    break
  fi
  echo "Waiting for Nomad to be ready... ($i/30)"
  sleep 5
done

# Create namespace if it doesn't exist
if [ "$ENVIRONMENT" == "pr" ]; then
  nomad namespace apply -description "PR #$PR_NUMBER environment" "$NAMESPACE" 2>/dev/null || true
fi

# Deploy Caddy
cat > /tmp/caddy-$ENVIRONMENT.nomad <<EOF
job "caddy-$NAMESPACE" {
  datacenters = ["$ENVIRONMENT"]
  namespace   = "$NAMESPACE"
  type        = "service"

  group "caddy" {
    count = 1

    network {
      port "http" { static = 80 }
      port "https" { static = 443 }
      port "admin" { to = 2019 }
    }

    task "caddy" {
      driver = "docker"
      
      config {
        image = "caddy:2-alpine"
        ports = ["http", "https", "admin"]
        volumes = [
          "local/Caddyfile:/etc/caddy/Caddyfile",
          "alloc/data:/data"
        ]
      }

      template {
        data = file("${path.module}/../nomad/configs/Caddyfile.$ENVIRONMENT")
        destination = "local/Caddyfile"
        change_mode = "restart"
      }

      resources {
        cpu    = 100
        memory = 128
      }
    }
  }
}
EOF

# Deploy Server
cat > /tmp/server-$ENVIRONMENT.nomad <<EOF
job "aipacto-server-$NAMESPACE" {
  datacenters = ["$ENVIRONMENT"]
  namespace   = "$NAMESPACE"
  type        = "service"
  
  group "server" {
    count = $([ "$ENVIRONMENT" == "production" ] && echo "3" || echo "1")

    network {
      port "http" { to = 3000 }
    }

    service {
      name = "aipacto-server"
      port = "http"
      tags = ["api", "$ENVIRONMENT"]
      
      check {
        type     = "http"
        path     = "/health"
        interval = "10s"
        timeout  = "2s"
      }
    }

    task "server" {
      driver = "docker"
      
      config {
        image = "developeraipacto/aipacto-server:$IMAGE_TAG"
        ports = ["http"]
      }
      
      env {
        NODE_ENV = "$ENVIRONMENT"
        PORT     = "3000"
      }

      resources {
        cpu    = 500
        memory = 1024
      }
    }
  }
}
EOF

# Deploy Web
cat > /tmp/web-$ENVIRONMENT.nomad <<EOF
job "aipacto-web-$NAMESPACE" {
  datacenters = ["$ENVIRONMENT"]
  namespace   = "$NAMESPACE"
  type        = "service"
  
  group "web" {
    count = $([ "$ENVIRONMENT" == "production" ] && echo "3" || echo "1")

    network {
      port "http" { to = 80 }
    }

    service {
      name = "aipacto-web"
      port = "http"
      tags = ["frontend", "$ENVIRONMENT"]
      
      check {
        type     = "http"
        path     = "/"
        interval = "10s"
        timeout  = "2s"
      }
    }

    task "web" {
      driver = "docker"
      
      config {
        image = "developeraipacto/pacto-web:$IMAGE_TAG"
        ports = ["http"]
      }

      resources {
        cpu    = 200
        memory = 512
      }
    }
  }
}
EOF

# Run the jobs
nomad job run /tmp/caddy-$ENVIRONMENT.nomad
nomad job run /tmp/server-$ENVIRONMENT.nomad
nomad job run /tmp/web-$ENVIRONMENT.nomad

echo "Applications deployed to $ENVIRONMENT"
