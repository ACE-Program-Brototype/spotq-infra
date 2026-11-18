variable "log_group_name" {
  description = "Name of the CloudWatch Log Group"
  type        = string
}

variable "ec2_log_retention_days" {
  description = "Number of days to retain EC2 OS/system logs in CloudWatch"
  type        = number
  default     = 90
}

variable "microservices_log_retention_days" {
  description = "Number of days to retain microservices container logs in CloudWatch"
  type        = number
  default     = 14
}

variable "instance_id" {
  description = "EC2 Instance ID to monitor"
  type        = string
}

variable "project_name" {
  description = "Project Name"
  type        = string
}

variable "environment" {
  description = "Environment Name"
  type        = string
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
}

variable "alarm_actions" {
  description = "List of ARNs (e.g. SNS topic) to notify when alarm triggers"
  type        = list(string)
  default     = []
}

variable "root_volume_id" {
  description = "EBS Root Volume ID of the EC2 instance for storage IOPS and latency metrics"
  type        = string
  default     = ""
}
