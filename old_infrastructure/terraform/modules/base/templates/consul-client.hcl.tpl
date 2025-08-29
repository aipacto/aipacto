datacenter = "${datacenter}"
data_dir = "/opt/consul"
bind_addr = "0.0.0.0"

encrypt = "${encrypt_key}"
retry_join = [${join(", ", formatlist("\"%s\"", server_ips))}]

server = false

ports {
  https = -1
}

