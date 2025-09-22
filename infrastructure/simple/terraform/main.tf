locals {
  name = "${var.project}-${var.environment}"
}

resource "hcloud_server" "vm" {
  name        = "${local.name}-vm-1"
  server_type = var.server_type
  image       = var.image
  location    = var.location
  ssh_keys    = var.ssh_public_keys

  # Attach permissive web firewall (HTTP/HTTPS + ICMP)
  firewall_ids = [hcloud_firewall.public_firewall.id]

  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }

  user_data = templatefile("${path.module}/templates/cloudinit.yaml.tmpl", {
    hostname          = "${local.name}-vm-1"
    domain            = var.domain
    tailscale_authkey = var.tailscale_authkey
    tailscale_tags    = var.tailscale_tags
    docker_namespace  = var.docker_namespace
    cloudflare_api_token = var.cloudflare_api_token
		ssh_public_key_content = var.ssh_public_key_content
  })
}

resource "hcloud_firewall" "public_firewall" {
  name = "${local.name}-web-firewall"

  # Allow SSH
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # Allow HTTP
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # Allow HTTPS
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # Allow ICMP for basic connectivity
  rule {
    direction  = "in"
    protocol   = "icmp"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}

data "hcloud_server" "vm" {
  id = hcloud_server.vm.id
}

resource "cloudflare_dns_record" "root" {
  zone_id = var.cloudflare_zone_id
  name    = var.domain
  type    = "A"
  content = data.hcloud_server.vm.ipv4_address
  proxied = false
  ttl     = 300
  depends_on = [hcloud_server.vm]
  lifecycle {
    ignore_changes = [ttl, proxied]
  }
}

resource "cloudflare_dns_record" "root_aaaa" {
  zone_id = var.cloudflare_zone_id
  name    = var.domain
  type    = "AAAA"
  content = data.hcloud_server.vm.ipv6_address
  proxied = false
  ttl     = 300
  depends_on = [hcloud_server.vm]
  lifecycle {
    ignore_changes = [ttl, proxied]
  }
}
