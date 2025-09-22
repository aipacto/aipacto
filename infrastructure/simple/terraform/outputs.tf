output "server_ipv4" {
  value = data.hcloud_server.vm.ipv4_address
}

output "server_ipv6" {
  value = data.hcloud_server.vm.ipv6_address
}

output "tailscale_info" {
  value = "Use Tailscale SSH to access the server once it joins your tailnet."
}

output "domain" {
  value = var.domain
}


