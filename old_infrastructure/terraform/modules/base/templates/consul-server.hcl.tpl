datacenter = "${datacenter}"
data_dir = "/opt/consul"
bind_addr = "0.0.0.0"

server = true
bootstrap_expect = ${server_count}

encrypt = "${encrypt_key}"

retry_join = [${join(", ", formatlist("\"%s\"", server_ips))}]

ports {
  https = -1
}

ui_config {
  enabled = true
}

