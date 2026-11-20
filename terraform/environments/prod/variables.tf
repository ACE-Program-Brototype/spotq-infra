variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "ap-southeast-2"
}

variable "environment" {
  description = "Environment Name"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project Name"
  type        = string
  default     = "spotq"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "m7i-flex.large"
}

variable "instance_state" {
  description = "Target state of the EC2 instance ('running' or 'stopped')"
  type        = string
  default     = "running"
}

variable "key_name" {
  description = "Name of the AWS key pair for SSH access"
  type        = string
  default     = "spotq-prod-key"
}

variable "allowed_ssh_cidr_blocks" {
  description = "List of CIDR blocks allowed to connect via SSH"
  type        = list(string)
  default     = []
}

variable "s3_allowed_origins" {
  description = "Allowed origins for S3 CORS policy"
  type        = list(string)
  default     = ["*"]
}

variable "app_port" {
  description = "Port used by API Gateway application container"
  type        = number
  default     = 10000
}

variable "cloudflare_tunnel_token" {
  description = "Cloudflare Tunnel Token for zero-trust connector"
  type        = string
  sensitive   = true
  default     = ""
}

variable "infisical_token" {
  description = "Infisical Service Token for automated secrets retrieval"
  type        = string
  sensitive   = true
  default     = ""
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

variable "alarm_actions" {
  description = "List of ARNs (e.g. SNS topic) to notify when alarm triggers"
  type        = list(string)
  default     = []
}

variable "alert_email" {
  description = "Email address to receive CloudWatch alarm notifications (set via Infisical TF_VAR_alert_email)"
  type        = string
  default     = ""
}
