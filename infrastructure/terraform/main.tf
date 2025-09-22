locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

resource "random_password" "k3s_token" {
  length  = 48
  special = false
}

# --- Hetzner Network ---

# Create a private network for the cluster nodes
resource "hcloud_network" "private_net" {
  name     = "${local.name_prefix}-network"
  ip_range = var.network_cidr
}

# Create a subnet within the private network
resource "hcloud_network_subnet" "subnet" {
  network_id   = hcloud_network.private_net.id
  type         = "cloud"
  network_zone = "eu-central"
  ip_range     = var.subnet_cidr
}

# --- Hetzner Firewall ---

# Firewall
# It only allows traffic from within the private network and for essential management (ICMP).
# Public web traffic (80/443) is explicitly NOT allowed here.
resource "hcloud_firewall" "nodes_firewall" {
  name = "${local.name_prefix}-nodes-firewall"

  # Allow all traffic from within our private network for cluster communication
  rule {
    direction  = "in"
    protocol   = "tcp"
    source_ips = [hcloud_network.private_net.ip_range]
    port       = "any"
  }
  rule {
    direction  = "in"
    protocol   = "udp"
    source_ips = [hcloud_network.private_net.ip_range]
    port       = "any"
  }

  # Allow ICMP (pings) from anywhere for basic connectivity checks.
  rule {
    direction  = "in"
    protocol   = "icmp"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # NOTE: We DO NOT open port 22 (SSH) to the public internet.
  # Access is managed securely via Tailscale SSH.
}

# Firewall for the Load Balancer
# This firewall is permissive for web traffic.
# It will be dynamically attached to the Load Balancer created by Kubernetes.
resource "hcloud_firewall" "load_balancer_firewall" {
  name = "${local.name_prefix}-lb-firewall"

  # Allow public HTTP traffic
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # Allow public HTTPS traffic
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}

# --- Kubernetes Node ---

# Control Plane Node
resource "hcloud_server" "control_plane" {
  name        = "${local.name_prefix}-control-plane-1"
  server_type = var.server_type
  image       = var.image
  location    = var.location

  ssh_keys = var.ssh_public_keys
  # Attach the STRICT node firewall to the server instance
  firewall_ids = [hcloud_firewall.nodes_firewall.id]

  public_net {
    ipv4_enabled = true
    ipv6_enabled = var.enable_ipv6
  }

  # Attach to the private network with a static IP
  network {
    network_id = hcloud_network.private_net.id
    ip         = cidrhost(var.subnet_cidr, 10) # e.g., 10.10.1.10
  }

  user_data = templatefile("${path.module}/cloud-init/controlplane.yaml.tmpl", {
    k3s_token         = random_password.k3s_token.result
    private_ip        = cidrhost(var.subnet_cidr, 10)
    tailscale_authkey = var.tailscale_authkey
    tailscale_tags    = var.tailscale_tags
    hostname          = "${local.name_prefix}-control-plane-1"
  })

  # Ensure the network exists before creating the server
  depends_on = [hcloud_network_subnet.subnet]
}

# Worker Nodes
resource "hcloud_server" "worker" {
  count       = var.node_count
  name        = "${local.name_prefix}-worker-${count.index + 1}"
  server_type = var.server_type
  image       = var.image
  location    = var.location

  ssh_keys = var.ssh_public_keys
  # Attach the STRICT node firewall to the worker instances
  firewall_ids = [hcloud_firewall.nodes_firewall.id]

  public_net {
    ipv4_enabled = true
    ipv6_enabled = var.enable_ipv6
  }
  
  # Attach to the private network with dynamic IPs from the subnet
  network {
    network_id = hcloud_network.private_net.id
    ip         = cidrhost(var.subnet_cidr, 20 + count.index) # e.g., 10.10.1.20, 10.10.1.21, ...
  }

  user_data = templatefile("${path.module}/cloud-init/worker.yaml.tmpl", {
    k3s_token         = random_password.k3s_token.result
    cp_private_ip     = one(hcloud_server.control_plane.network).ip
    private_ip        = cidrhost(var.subnet_cidr, 20 + count.index)
    tailscale_authkey = var.tailscale_authkey
    tailscale_tags    = var.tailscale_tags
    hostname          = "${local.name_prefix}-worker-${count.index + 1}"
  })

  # Do not attempt to create workers until the control plane and firewall are fully provisioned
  depends_on = [
		hcloud_server.control_plane,hcloud_firewall.nodes_firewall
	]
}
