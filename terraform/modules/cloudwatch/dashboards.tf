data "aws_region" "current" {}

resource "aws_cloudwatch_dashboard" "infra" {
  dashboard_name = "${var.project_name}-infra"

  dashboard_body = templatefile("${path.module}/dashboards/spotq-infra.json", {
    region            = data.aws_region.current.name
    instance_id       = var.instance_id
    volume_id         = var.root_volume_id
    log_group_ec2_arn = aws_cloudwatch_log_group.app_logs.arn
    alarm_cpu         = aws_cloudwatch_metric_alarm.high_cpu.arn
    alarm_memory      = aws_cloudwatch_metric_alarm.high_memory.arn
    alarm_disk        = aws_cloudwatch_metric_alarm.high_disk.arn
    alarm_status      = aws_cloudwatch_metric_alarm.status_check_failed.arn
  })
}

resource "aws_cloudwatch_dashboard" "services" {
  dashboard_name = "${var.project_name}-services"

  dashboard_body = templatefile("${path.module}/dashboards/spotq-services.json", {
    region                 = data.aws_region.current.name
    log_group_services_arn = aws_cloudwatch_log_group.microservices_logs.arn
    alarm_cpu              = aws_cloudwatch_metric_alarm.high_cpu.arn
    alarm_memory           = aws_cloudwatch_metric_alarm.high_memory.arn
    alarm_disk             = aws_cloudwatch_metric_alarm.high_disk.arn
    alarm_status           = aws_cloudwatch_metric_alarm.status_check_failed.arn
  })
}
