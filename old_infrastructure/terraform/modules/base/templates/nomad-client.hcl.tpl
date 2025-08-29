datacenter = "${datacenter}"
data_dir = "/opt/nomad"
bind_addr = "{{ GetPrivateInterfaces | include \"network\" \"100.64.0.0/10\" | attr \"address\" || GetPrivateInterfaces | include \"network\" \"10.0.0.0/8\" | attr \"address\" }}"

client {
  enabled = true
  servers = [${nomad_servers}]
}

plugin "docker" {
  config {
    volumes {
      enabled = true
    }
  }
}
