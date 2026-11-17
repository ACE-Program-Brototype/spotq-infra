variable "log_group_name" {
  description = "Name of the CloudWatch Log Group"
  type        = string
}

variable "retention_in_days" {
  description = "Number of days to retain log events in CloudWatch"
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
