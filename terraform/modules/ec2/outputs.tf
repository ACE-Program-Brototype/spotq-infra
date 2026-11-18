output "instance_id" {
  value = aws_instance.server.id
}

output "public_ip" {
  value = aws_instance.server.public_ip
}

output "public_dns" {
  value = aws_instance.server.public_dns
}

output "private_ip" {
  value = aws_instance.server.private_ip
}

output "root_volume_id" {
  value = aws_instance.server.root_block_device[0].volume_id
}
