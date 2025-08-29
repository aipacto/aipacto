datacenter = "${datacenter}"
data_dir = "/opt/nomad"
bind_addr = "0.0.0.0"
log_level = "INFO"

# Prioritizes Tailscale IPs (100.64.0.0/10) for internal comms, falling back to Hetzner private net (10.0.0.0/8)
advertise {
	http = "{{ GetPrivateInterfaces | include \"network\" \"100.64.0.0/10\" | attr \"address\" || GetPrivateInterfaces | include \"network\" \"10.0.0.0/8\" | attr \"address\" }}"
  rpc  = "{{ GetPrivateInterfaces | include \"network\" \"100.64.0.0/10\" | attr \"address\" || GetPrivateInterfaces | include \"network\" \"10.0.0.0/8\" | attr \"address\" }}"
  serf = "{{ GetPrivateInterfaces | include \"network\" \"100.64.0.0/10\" | attr \"address\" || GetPrivateInterfaces | include \"network\" \"10.0.0.0/8\" | attr \"address\" }}"
}

server {
  enabled = true
  bootstrap_expect = ${server_count}
}

consul {
  address = "127.0.0.1:8500"
}
