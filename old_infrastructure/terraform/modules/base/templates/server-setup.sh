#!/bin/bash
set -euo pipefail

# ===== Template vars injected by Terraform (DO NOT rename) =====
NODE_TYPE="${node_type}"                 # "server" | "client" (informational)
NOMAD_VERSION="${nomad_version}"         # e.g. "1.9.2"
CONSUL_VERSION="${consul_version}"       # e.g. "1.20.1"
DOCKER_VERSION="${docker_version}"       # currently not pinned by script (kept for future pinning)

# Nomad/Consul HCL configs rendered by Terraform templates
NOMAD_CONFIG=$(cat <<'EOF'
${nomad_config}
EOF
)

CONSUL_CONFIG=$(cat <<'EOF'
${consul_config}
EOF
)

echo "[setup] Node type: $${NODE_TYPE}"
echo "[setup] Nomad: $${NOMAD_VERSION} | Consul: $${CONSUL_VERSION}"

# ===== OS prep =====
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y \
  curl unzip jq ca-certificates lsb-release gnupg software-properties-common

# ===== Docker (engine + compose plugin) =====
# Using get.docker.com for brevity & reliability on Ubuntu 24.04
echo "[docker] Installing Docker..."
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl restart docker || true
# (Optional) put default logging/overlay2 settings
cat >/etc/docker/daemon.json <<'JSON'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" },
  "storage-driver": "overlay2"
}
JSON
systemctl restart docker || true

# ===== Consul =====
echo "[consul] Installing Consul $${CONSUL_VERSION} ..."
curl -fsSL "https://releases.hashicorp.com/consul/$${CONSUL_VERSION}/consul_$${CONSUL_VERSION}_linux_amd64.zip" -o /tmp/consul.zip
unzip -o /tmp/consul.zip -d /usr/local/bin
rm -f /tmp/consul.zip
chmod +x /usr/local/bin/consul

# ===== Nomad =====
echo "[nomad] Installing Nomad $${NOMAD_VERSION} ..."
curl -fsSL "https://releases.hashicorp.com/nomad/$${NOMAD_VERSION}/nomad_$${NOMAD_VERSION}_linux_amd64.zip" -o /tmp/nomad.zip
unzip -o /tmp/nomad.zip -d /usr/local/bin
rm -f /tmp/nomad.zip
chmod +x /usr/local/bin/nomad

# ===== CNI plugins (required by Nomad Docker tasks for networking/volumes) =====
echo "[cni] Installing CNI plugins ..."
CNI_VERSION="1.5.1"
curl -fsSL -o /tmp/cni-plugins.tgz \
  "https://github.com/containernetworking/plugins/releases/download/v$${CNI_VERSION}/cni-plugins-linux-amd64-v$${CNI_VERSION}.tgz"
mkdir -p /opt/cni/bin
tar -C /opt/cni/bin -xzf /tmp/cni-plugins.tgz
rm -f /tmp/cni-plugins.tgz

# ===== Directories & permissions =====
mkdir -p /etc/consul.d /opt/consul /var/log/consul
mkdir -p /etc/nomad.d  /opt/nomad  /var/log/nomad
chmod 750 /etc/consul.d /etc/nomad.d

# ===== Write configs =====
echo "$${CONSUL_CONFIG}" >/etc/consul.d/consul.hcl
echo "$${NOMAD_CONFIG}"  >/etc/nomad.d/nomad.hcl

# Validate configs before creating services (fail early if bad)
consul validate /etc/consul.d/consul.hcl
nomad agent -validate -config=/etc/nomad.d

# ===== systemd units =====
cat >/etc/systemd/system/consul.service <<'UNIT'
[Unit]
Description=HashiCorp Consul Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=notify
User=root
ExecStart=/usr/local/bin/consul agent -config-dir=/etc/consul.d
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

cat >/etc/systemd/system/nomad.service <<'UNIT'
[Unit]
Description=HashiCorp Nomad Agent
After=network-online.target consul.service docker.service
Requires=consul.service docker.service

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/nomad agent -config=/etc/nomad.d/nomad.hcl
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
UNIT

# ===== Enable & start =====
systemctl daemon-reload
systemctl enable consul nomad docker

echo "[consul] Starting Consul..."
systemctl start consul

# Wait until Consul is up (UI port 8500 or leader endpoint)
echo -n "[consul] Waiting for leader"
for i in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:8500/v1/status/leader | grep -q '"'; then
    echo " ...ok"
    break
  fi
  echo -n "."
  sleep 2
done

echo "[nomad] Starting Nomad..."
systemctl start nomad

# Optional: small wait to let Nomad register
sleep 3

echo "[verify] Consul members:"
consul members || true
echo "[verify] Nomad server members (if server):"
nomad server members || true
echo "[verify] Nomad node status:"
nomad node status || true

echo "[done] $${NODE_TYPE} node is initialized with Docker + Consul $${CONSUL_VERSION} + Nomad $${NOMAD_VERSION}"

# ===== Tailscale =====
if [ -n "${tailscale_auth_key}" ]; then
  echo "[tailscale] Installing Tailscale..."
  curl -fsSL https://tailscale.com/install.sh | sh
  echo "[tailscale] Starting Tailscale..."
  tailscale up --authkey="${tailscale_auth_key}" --hostname="${tailscale_hostname_prefix}-$${NODE_TYPE}-${datacenter}" $${tailscale_enable_ssh:+--ssh}
	
  # Add tags if provided
  if [ -n "${tailscale_tags}" ]; then
    tailscale set --advertise-tags "${tailscale_tags}"
  fi

	# Enable as systemd service for persistence
  systemctl enable --now tailscaled
fi
