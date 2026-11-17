output "log_group_name" {
  description = "Name of the CloudWatch Log Group for system/EC2 logs"
  value       = aws_cloudwatch_log_group.app_logs.name
}

output "log_group_arn" {
  description = "ARN of the CloudWatch Log Group for system/EC2 logs"
  value       = aws_cloudwatch_log_group.app_logs.arn
}

output "microservices_log_group_name" {
  description = "Name of the CloudWatch Log Group for microservices container logs"
  value       = aws_cloudwatch_log_group.microservices_logs.name
}

output "microservices_log_group_arn" {
  description = "ARN of the CloudWatch Log Group for microservices container logs"
  value       = aws_cloudwatch_log_group.microservices_logs.arn
}

output "high_cpu_alarm_arn" {
  description = "ARN of the High CPU CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.high_cpu.arn
}

output "status_check_alarm_arn" {
  description = "ARN of the Status Check Failed CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.status_check_failed.arn
}

output "high_memory_alarm_arn" {
  description = "ARN of the High Memory CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.high_memory.arn
}

output "high_disk_alarm_arn" {
  description = "ARN of the High Disk CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.high_disk.arn
}
