output "cp_public_ip" {
  value       = hcloud_server.control_plane.ipv4_address
  description = "Control-plane public IPv4 (prefer Tailscale SSH)."
}

output "cp_private_ip" {
  value       = one(hcloud_server.control_plane.network).ip
  description = "Control-plane private IPv4 inside the Hetzner network."
}

output "worker_private_ips" {
  value       = [for s in hcloud_server.worker : one(s.network).ip]
  description = "Worker node private IPs."
}

output "tailscale_hostnames" {
  value       = concat([hcloud_server.control_plane.name], [for s in hcloud_server.worker : s.name])
  description = "Hostnames you can use with `tailscale ssh tsadmin@<name>`."
}

output "kube_hint" {
  value = "Fetch kubeconfig: tailscale ssh tsadmin@${hcloud_server.control_plane.name} 'sudo cat /etc/rancher/k3s/k3s.yaml' > ./kubeconfig"
}

output "troubleshooting_commands" {
  value = <<-EOT
    Check cloud-init status:
      tailscale ssh tsadmin@${hcloud_server.control_plane.name} 'cloud-init status --long'
    
    Check k3s status:
      tailscale ssh tsadmin@${hcloud_server.control_plane.name} 'sudo systemctl status k3s'
    
    View cloud-init logs:
      tailscale ssh tsadmin@${hcloud_server.control_plane.name} 'sudo tail -100 /var/log/cloud-init-output.log'
    
    Get k3s token for manual worker join:
      tailscale ssh tsadmin@${hcloud_server.control_plane.name} 'sudo cat /var/lib/rancher/k3s/server/node-token'
  EOT
}
