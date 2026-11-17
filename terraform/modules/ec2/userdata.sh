#!/bin/bash
set -euo pipefail

# Update system package repositories
dnf update -y

# Install Docker and Git (curl is already provided by curl-minimal)
dnf install -y docker git

# Install Docker Compose V2 plugin
mkdir -p /usr/libexec/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" \
  -o /usr/libexec/docker/cli-plugins/docker-compose
chmod +x /usr/libexec/docker/cli-plugins/docker-compose

# Enable and start Docker daemon
systemctl enable docker
systemctl start docker

# Add the default ec2-user to the docker group for non-root docker access
usermod -aG docker ec2-user

# Install Infisical CLI for runtime secret retrieval (RPM repository for Amazon Linux)
curl -1sLf 'https://artifacts-cli.infisical.com/setup.rpm.sh' | bash
dnf install -y infisical

# Configure Infisical Service Token system-wide if provided
if [ -n "${infisical_token}" ]; then
  echo "INFISICAL_TOKEN=\"${infisical_token}\"" >> /etc/environment
  echo "export INFISICAL_TOKEN=\"${infisical_token}\"" > /etc/profile.d/infisical.sh
  chmod +x /etc/profile.d/infisical.sh
fi

# Install Cloudflare Tunnel (cloudflared)
curl -fsSl https://pkg.cloudflare.com/cloudflared-ascii.repo | tee /etc/yum.repos.d/cloudflared.repo
dnf install -y cloudflared

# If tunnel token is provided, install and start cloudflared service
if [ -n "${cloudflare_tunnel_token}" ]; then
  cloudflared service install "${cloudflare_tunnel_token}"
  systemctl enable cloudflared
  systemctl start cloudflared
fi
