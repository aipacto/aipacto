terraform {
  required_version = ">= 1.13.0, < 2.0.0"
  
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.52.0"
    }
    cloudinit = {
      source  = "hashicorp/cloudinit"
      version = "~> 2.3.7"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
  }
}

# Local variables for environment configuration
locals {
  # Environment-specific naming
  env_suffix = var.is_pr_environment ? "pr-${var.pr_number}" : var.environment
  name_prefix = "${var.project_name}-${local.env_suffix}"
  
  # Server sizing based on environment - optimized for cost
  server_configs = {
    production = {
      server_type = "cx22"  # 2 vCPU, 4GB RAM - €4.59/month (lowest cost available)
      server_count = 3      # Keep 3 for HA
      client_count = 1
    }
    staging = {
      server_type = "cx22"  # 2 vCPU, 4GB RAM - €4.59/month
      server_count = 1      # Single server for staging (HA not critical)
      client_count = 2
    }
    pr = {
      server_type = "cx22"  # 2 vCPU, 4GB RAM - €4.59/month (CX11 deprecated)
      server_count = 1
      client_count = 1
    }
  }
  
  # Select configuration based on environment
  current_config = var.is_pr_environment ? local.server_configs.pr : local.server_configs[var.environment]
  
  # Common labels for all resources
  common_labels = {
    project     = var.project_name
    environment = local.env_suffix
    managed_by  = "terraform"
    created_at  = formatdate("YYYYMMDD-HHmmss", timestamp())
  }
  
  # PR-specific labels
  pr_labels = var.is_pr_environment ? {
    pr_number   = tostring(var.pr_number)
    ephemeral   = "true"
    ttl         = var.pr_ttl
    expires_at  = formatdate("YYYYMMDD-HHmmss", timeadd(timestamp(), var.pr_ttl))
  } : {}
  
  # Merge all labels
  resource_labels = merge(local.common_labels, local.pr_labels, var.additional_labels)
}

# Network Configuration
resource "hcloud_network" "main" {
  name     = "${local.name_prefix}-network"
  ip_range = var.network_ip_range
  labels   = local.resource_labels
}

resource "hcloud_network_subnet" "main" {
  network_id   = hcloud_network.main.id
  type         = "cloud"
  network_zone = var.network_zone
  ip_range     = cidrsubnet(var.network_ip_range, 8, var.subnet_offset)
}

# Firewall Configuration
resource "hcloud_firewall" "main" {
  name = "${local.name_prefix}-firewall"
  labels = local.resource_labels

  # SSH Access (optional; enable only when ssh_exposed=true)
  dynamic "rule" {
    for_each = var.ssh_exposed ? [1] : []
    content {
      direction = "in"
      protocol = "tcp"
      port = "22"
      source_ips = var.ssh_allowed_ips
    }
  }

  # HTTP/HTTPS Access
  rule {
    direction = "in"
    protocol = "tcp"
    port = "80"
    source_ips = var.is_pr_environment ? var.pr_allowed_ips : ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction = "in"
    protocol = "tcp"
    port = "443"
    source_ips = var.is_pr_environment ? var.pr_allowed_ips : ["0.0.0.0/0", "::/0"]
  }

  # Nomad/Consul UI (restricted to admin IPs)
  rule {
    direction = "in"
    protocol = "tcp"
    port = "4646"
    source_ips = [var.network_ip_range]
  }

  rule {
    direction = "in"
    protocol = "tcp"
    port = "8500"
    source_ips = [var.network_ip_range]
  }

  # Internal cluster communication
  rule {
    direction = "in"
    protocol = "tcp"
    port = "4647-4648"
    source_ips = [var.network_ip_range]
  }

  rule {
    direction = "in"
    protocol = "tcp"
    port = "8300-8302"
    source_ips = [var.network_ip_range]
  }

  rule {
    direction = "in"
    protocol = "udp"
    port = "4648"
    source_ips = [var.network_ip_range]
  }

  rule {
    direction = "in"
    protocol = "udp"
    port = "8301-8302"
    source_ips = [var.network_ip_range]
  }

  # NEW: Tailscale peering (insert here, after internal cluster rules)
  rule {
    direction = "in"
    protocol  = "udp"
    port      = "41641"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # Allow all outbound (these follow)
  rule {
    direction = "out"
    protocol = "tcp"
    port = "any"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction = "out"
    protocol = "udp"
    port = "any"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction = "out"
    protocol = "icmp"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }
}

# SSH Key Data
data "hcloud_ssh_key" "keys" {
  for_each = toset(var.ssh_key_names)
  name     = each.value
}

locals {
  nomad_server_config = templatefile("${path.module}/templates/nomad-server.hcl.tpl", {
    datacenter   = local.env_suffix
    server_count = local.current_config.server_count
  })
  
	consul_server_config = templatefile("${path.module}/templates/consul-server.hcl.tpl", {
		datacenter   = local.env_suffix
		server_count = local.current_config.server_count
		encrypt_key  = random_id.consul_encrypt.b64_std
		server_ips   = [for i in range(local.current_config.server_count) : cidrhost(hcloud_network_subnet.main.ip_range, 10 + i)]
  })

  nomad_client_config = templatefile("${path.module}/templates/nomad-client.hcl.tpl", {
    datacenter    = local.env_suffix
    nomad_servers = join(", ", [for s in hcloud_server.nomad_server : format("\"%s\"", s.ipv4_address)])
  })

	consul_client_config = templatefile("${path.module}/templates/consul-client.hcl.tpl", {
		datacenter  = local.env_suffix
		encrypt_key = random_id.consul_encrypt.b64_std
		server_ips  = [for i in range(local.current_config.server_count) : cidrhost(hcloud_network_subnet.main.ip_range, 10 + i)]
		})
}

# Generate Consul encryption key
resource "random_id" "consul_encrypt" {
  byte_length = 32
}

# Updated user_data for servers
data "cloudinit_config" "nomad_server" {
  gzip          = true
  base64_encode = true

  part {
    content_type = "text/x-shellscript"
    content = templatefile("${path.module}/templates/server-setup.sh", {
      node_type      = "server"
      nomad_version  = var.nomad_version
      consul_version = var.consul_version
      docker_version = var.docker_version
      nomad_config   = local.nomad_server_config
      consul_config  = local.consul_server_config
      server_ips     = [for i in range(local.current_config.server_count) : 
                        cidrhost(hcloud_network_subnet.main.ip_range, 10 + i)]
			tailscale_auth_key = var.tailscale_auth_key
			tailscale_enable_ssh = var.tailscale_enable_ssh
			tailscale_tags = join(",", var.tailscale_tags)
			tailscale_hostname_prefix = var.tailscale_hostname_prefix
			datacenter = local.env_suffix
    })
  }
}

# Client cloud-init with client configs
data "cloudinit_config" "nomad_client" {
  gzip          = true
  base64_encode = true

  part {
    content_type = "text/x-shellscript"
    content = templatefile("${path.module}/templates/server-setup.sh", {
      node_type      = "client"
      nomad_version  = var.nomad_version
      consul_version = var.consul_version
      docker_version = var.docker_version
      nomad_config   = local.nomad_client_config
      consul_config  = local.consul_client_config
      server_ips     = [for i in range(local.current_config.server_count) : 
                        cidrhost(hcloud_network_subnet.main.ip_range, 10 + i)]
			tailscale_auth_key = var.tailscale_auth_key
			tailscale_enable_ssh = var.tailscale_enable_ssh
			tailscale_tags = join(",", var.tailscale_tags)
			tailscale_hostname_prefix = var.tailscale_hostname_prefix
			datacenter = local.env_suffix
    })
  }
}

# Nomad/Consul Servers
resource "hcloud_server" "nomad_server" {
  count = local.current_config.server_count
  
  name        = "${local.name_prefix}-nomad-server-${count.index + 1}"
  server_type = local.current_config.server_type
  image       = var.server_image
  location    = var.server_location
  ssh_keys    = [for k in data.hcloud_ssh_key.keys : k.id]
  firewall_ids = [hcloud_firewall.main.id]
  user_data   = data.cloudinit_config.nomad_server.rendered
  
  labels = merge(local.resource_labels, {
    role = "nomad-server"
    index = tostring(count.index)
  })
  
  network {
    network_id = hcloud_network.main.id
  }
}

# Nomad Clients (Workers)
resource "hcloud_server" "nomad_client" {
  count = local.current_config.client_count
  
  name        = "${local.name_prefix}-nomad-client-${count.index + 1}"
  server_type = local.current_config.server_type
  image       = var.server_image
  location    = var.server_location
  ssh_keys    = [for k in data.hcloud_ssh_key.keys : k.id]
  firewall_ids = [hcloud_firewall.main.id]
  user_data   = data.cloudinit_config.nomad_client.rendered
  
  labels = merge(local.resource_labels, {
    role = "nomad-client"
    index = tostring(count.index)
  })
  
  network {
    network_id = hcloud_network.main.id
  }
  
  lifecycle {
    ignore_changes = [ssh_keys, user_data]
  }
}

# Load Balancer for non-PR environments
resource "hcloud_load_balancer" "main" {
	load_balancer_type = "lb11"
  count = var.is_pr_environment ? 0 : 1
  name  = "${local.name_prefix}-lb"
  location = var.server_location
  labels = merge(local.resource_labels, { role = "public-lb" })
}

resource "hcloud_load_balancer_network" "main" {
  count = var.is_pr_environment ? 0 : 1
  load_balancer_id = hcloud_load_balancer.main[0].id
  network_id       = hcloud_network.main.id
  # Private IP allocated automatically
}

resource "hcloud_load_balancer_target" "servers" {
  count = var.is_pr_environment ? 0 : length(hcloud_server.nomad_client)
  type  = "server"
  load_balancer_id = hcloud_load_balancer.main[0].id
  server_id        = hcloud_server.nomad_client[count.index].id
  use_private_ip   = true
}

resource "hcloud_load_balancer_service" "http" {
  count = var.is_pr_environment ? 0 : 1
  load_balancer_id = hcloud_load_balancer.main[0].id
  protocol = "tcp"
  listen_port = 80
  destination_port = 80
  health_check {
    protocol = "http"
    port     = 80
    interval = 10
    timeout  = 5
    retries  = 3
  }
}

resource "hcloud_load_balancer_service" "https" {
  count = var.is_pr_environment ? 0 : 1
  load_balancer_id = hcloud_load_balancer.main[0].id
  protocol = "tcp"
  listen_port = 443
  destination_port = 443
  # Optional TCP health check on 443; we keep HTTP on 80 for readiness
}
