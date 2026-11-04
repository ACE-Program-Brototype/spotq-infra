#!/bin/bash
set -euo pipefail

# Update system package repositories
apt-get update -y

# Install Docker, Docker Compose V2 plugin, Git, and Curl
apt-get install -y \
    docker.io \
    docker-compose-plugin \
    git \
    curl

# Enable and start Docker daemon
systemctl enable docker
systemctl start docker

# Add the default ubuntu user to the docker group for non-root docker access
usermod -aG docker ubuntu

# Install Infisical CLI for runtime secret retrieval
curl -1sLf 'https://artifacts-cli.infisical.com/setup.deb.sh' | bash
apt-get update -y
apt-get install -y infisical
