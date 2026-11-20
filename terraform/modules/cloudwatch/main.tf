resource "aws_cloudwatch_log_group" "app_logs" {
  name              = var.log_group_name
  retention_in_days = var.ec2_log_retention_days
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "microservices_logs" {
  name              = "/${var.project_name}/${var.environment}/microservices"
  retention_in_days = var.microservices_log_retention_days
  tags              = var.tags
}

resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-high-cpu"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Triggered when EC2 CPU utilization exceeds 80% for 10 consecutive minutes"
  treat_missing_data  = "missing"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.alarm_actions

  dimensions = {
    InstanceId = var.instance_id
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "status_check_failed" {
  alarm_name          = "${var.project_name}-${var.environment}-status-check-failed"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Maximum"
  threshold           = 1
  alarm_description   = "Triggered when EC2 instance or system status check fails"
  treat_missing_data  = "breaching"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.alarm_actions

  dimensions = {
    InstanceId = var.instance_id
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name          = "${var.project_name}-${var.environment}-high-memory"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "mem_used_percent"
  namespace           = "CWAgent"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "Triggered when EC2 memory utilization exceeds 85% for 10 consecutive minutes"
  treat_missing_data  = "missing"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.alarm_actions

  dimensions = {
    InstanceId = var.instance_id
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "high_disk" {
  alarm_name          = "${var.project_name}-${var.environment}-high-disk"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "disk_used_percent"
  namespace           = "CWAgent"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "Triggered when EC2 root filesystem utilization exceeds 85% for 10 consecutive minutes"
  treat_missing_data  = "missing"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.alarm_actions

  dimensions = {
    InstanceId = var.instance_id
    path       = "/"
    fstype     = "xfs"
  }

  tags = var.tags
}
