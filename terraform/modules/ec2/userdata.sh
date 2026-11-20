#!/bin/bash
set -euo pipefail

# Update system package repositories
dnf update -y

# Install Docker, Git, Amazon CloudWatch Agent, and rsyslog (required for /var/log/messages on AL2023)
dnf install -y docker git amazon-cloudwatch-agent rsyslog
systemctl enable --now rsyslog

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

# Configure and start Amazon CloudWatch Agent if log group is configured
if [ -n "${ec2_log_group_name}" ]; then
  mkdir -p /opt/aws/amazon-cloudwatch-agent/etc
  cat << 'CWEOF' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root"
  },
  "metrics": {
    "namespace": "CWAgent",
    "append_dimensions": {
      "InstanceId": "$${aws:InstanceId}"
    },
    "metrics_collected": {
      "mem": {
        "measurement": [
          "mem_used_percent"
        ]
      },
      "disk": {
        "measurement": [
          "used_percent"
        ],
        "resources": [
          "/"
        ],
        "drop_device": true
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "${ec2_log_group_name}",
            "log_stream_name": "{instance_id}/messages",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/secure",
            "log_group_name": "${ec2_log_group_name}",
            "log_stream_name": "{instance_id}/secure",
            "timezone": "UTC"
          }
        ]
      }
    }
  }
}
CWEOF

  /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
fi
