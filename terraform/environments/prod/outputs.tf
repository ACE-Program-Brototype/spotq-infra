output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = module.ec2.instance_id
}

output "ec2_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = module.ec2.public_ip
}

output "ec2_public_dns" {
  description = "Public DNS hostname of the EC2 instance"
  value       = module.ec2.public_dns
}

output "ec2_private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = module.ec2.private_ip
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for assets"
  value       = module.s3.bucket_name
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for assets"
  value       = module.s3.bucket_arn
}

output "security_group_id" {
  description = "ID of the SpotQ security group"
  value       = module.security.security_group_id
}

output "security_group_name" {
  description = "Name of the SpotQ security group"
  value       = module.security.security_group_name
}

output "iam_role_name" {
  description = "Name of the IAM role attached to EC2"
  value       = module.iam.role_name
}

output "iam_role_arn" {
  description = "ARN of the IAM role attached to EC2"
  value       = module.iam.role_arn
}

output "iam_instance_profile_name" {
  description = "Name of the IAM instance profile attached to EC2"
  value       = module.iam.instance_profile_name
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch Log Group for system/EC2 logs"
  value       = module.cloudwatch.log_group_name
}

output "cloudwatch_microservices_log_group_name" {
  description = "Name of the CloudWatch Log Group for microservices container logs"
  value       = module.cloudwatch.microservices_log_group_name
}

output "cloudwatch_microservices_log_group_arn" {
  description = "ARN of the CloudWatch Log Group for microservices container logs"
  value       = module.cloudwatch.microservices_log_group_arn
}

output "cloudwatch_high_cpu_alarm_arn" {
  description = "ARN of the CloudWatch CPU utilization alarm"
  value       = module.cloudwatch.high_cpu_alarm_arn
}

output "cloudwatch_status_check_alarm_arn" {
  description = "ARN of the CloudWatch instance status check alarm"
  value       = module.cloudwatch.status_check_alarm_arn
}

output "cloudwatch_high_memory_alarm_arn" {
  description = "ARN of the CloudWatch memory utilization alarm"
  value       = module.cloudwatch.high_memory_alarm_arn
}

output "cloudwatch_high_disk_alarm_arn" {
  description = "ARN of the CloudWatch disk utilization alarm"
  value       = module.cloudwatch.high_disk_alarm_arn
}

output "cloudwatch_sns_topic_arn" {
  description = "ARN of the SNS topic for alarm notifications"
  value       = module.sns.topic_arn
}

output "cloudwatch_infra_dashboard_name" {
  description = "Name of the host infrastructure CloudWatch dashboard"
  value       = module.cloudwatch.infra_dashboard_name
}

output "cloudwatch_services_dashboard_name" {
  description = "Name of the microservices CloudWatch dashboard"
  value       = module.cloudwatch.services_dashboard_name
}


