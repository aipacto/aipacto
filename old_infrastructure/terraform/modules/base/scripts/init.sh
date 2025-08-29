#!/bin/bash

set -e

# Template variables
NOMAD_VERSION="${nomad_version}"
CONSUL_VERSION="${consul_version}"
DOCKER_VERSION="${docker_version}"
ENVIRONMENT="${environment}"

echo "Initializing server for environment: $ENVIRONMENT"

# Update system
apt-get update
apt-get upgrade -y
apt-get install -y \
  apt-transport-https \
  ca-certificates \
  curl \
  gnupg \
  lsb-release \
  software-properties-common \
  unzip \
  jq \
  git

# Install Docker
echo "Installing Docker ${DOCKER_VERSION}..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Configure Docker
cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

systemctl restart docker
systemctl enable docker

# Add user to docker group
usermod -aG docker ubuntu 2>/dev/null || true

# Install Consul
echo "Installing Consul ${CONSUL_VERSION}..."
curl -sSL "https://releases.hashicorp.com/consul/${CONSUL_VERSION}/consul_${CONSUL_VERSION}_linux_amd64.zip" -o /tmp/consul.zip
unzip -o /tmp/consul.zip -d /usr/local/bin
rm /tmp/consul.zip
chmod +x /usr/local/bin/consul

# Install Nomad
echo "Installing Nomad ${NOMAD_VERSION}..."
curl -sSL "https://releases.hashicorp.com/nomad/${NOMAD_VERSION}/nomad_${NOMAD_VERSION}_linux_amd64.zip" -o /tmp/nomad.zip
unzip -o /tmp/nomad.zip -d /usr/local/bin
rm /tmp/nomad.zip
chmod +x /usr/local/bin/nomad

# Install CNI plugins for Nomad
echo "Installing CNI plugins..."
CNI_VERSION="1.5.1"
curl -L -o /tmp/cni-plugins.tgz "https://github.com/containernetworking/plugins/releases/download/v${CNI_VERSION}/cni-plugins-linux-amd64-v${CNI_VERSION}.tgz"
mkdir -p /opt/cni/bin
tar -C /opt/cni/bin -xzf /tmp/cni-plugins.tgz
rm /tmp/cni-plugins.tgz

# Create directories
mkdir -p /etc/consul.d /opt/consul
mkdir -p /etc/nomad.d /opt/nomad
mkdir -p /var/log/consul /var/log/nomad

# Create users
useradd --system --home /etc/consul.d --shell /bin/false consul 2>/dev/null || true
useradd --system --home /etc/nomad.d --shell /bin/false nomad 2>/dev/null || true

chown -R consul:consul /opt/consul /etc/consul.d /var/log/consul
chown -R nomad:nomad /opt/nomad /etc/nomad.d /var/log/nomad

echo "Base initialization complete for $ENVIRONMENT"
