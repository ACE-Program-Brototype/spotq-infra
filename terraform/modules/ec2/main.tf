data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "server" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type
  key_name      = var.key_name

  vpc_security_group_ids = [
    var.security_group_id
  ]

  iam_instance_profile = var.instance_profile_name
  user_data = templatefile("${path.module}/userdata.sh", {
    cloudflare_tunnel_token = var.cloudflare_tunnel_token
    infisical_token         = var.infisical_token
    ec2_log_group_name      = var.ec2_log_group_name
  })
  user_data_replace_on_change = false

  root_block_device {
    volume_size           = 40
    volume_type           = "gp3"
    iops                  = 3000
    throughput            = 125
    encrypted             = true
    delete_on_termination = true

    tags = merge(
      var.tags,
      {
        Name = "${var.instance_name}-root-volume"
      }
    )
  }

  tags = merge(
    var.tags,
    {
      Name = var.instance_name
    }
  )
}

resource "aws_ec2_instance_state" "server_state" {
  instance_id = aws_instance.server.id
  state       = var.instance_state
}
