output "network_id" {
  value = hcloud_network.main.id
}

output "subnet_id" {
  value = hcloud_network_subnet.main.id
}

output "nomad_server_ips" {
  value = [for s in hcloud_server.nomad_server : s.ipv4_address]
}

output "nomad_client_ips" {
  value = [for s in hcloud_server.nomad_client : s.ipv4_address]
}

output "load_balancer_ip" {
  value = var.is_pr_environment ? (
    length(hcloud_server.nomad_client) > 0 ? hcloud_server.nomad_client[0].ipv4_address : ""
  ) : (
    length(hcloud_load_balancer.main) > 0 ? hcloud_load_balancer.main[0].ipv4 : ""
  )
}

output "environment_url" {
  value = var.is_pr_environment ? (length(hcloud_server.nomad_client) > 0
      ? format("http://%s", hcloud_server.nomad_client[0].ipv4_address)
      : "") : format("https://%s", var.domain_name)
}

output "nomad_ui_url" {
  value = length(hcloud_server.nomad_server) > 0 ? format("http://%s:4646", hcloud_server.nomad_server[0].ipv4_address) : ""
}

output "consul_ui_url" {
  value = length(hcloud_server.nomad_server) > 0 ? format("http://%s:8500", hcloud_server.nomad_server[0].ipv4_address) : ""
}

output "environment_info" {
  value = {
    name        = local.env_suffix
    type        = var.is_pr_environment ? "pr" : var.environment
    pr_number   = var.is_pr_environment ? var.pr_number : null
    expires_at  = var.is_pr_environment ? timeadd(timestamp(), var.pr_ttl) : null
    servers     = length(hcloud_server.nomad_server)
    clients     = length(hcloud_server.nomad_client)
  }
}
