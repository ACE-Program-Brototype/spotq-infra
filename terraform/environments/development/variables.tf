variable "aws_region" {
  description = "AWS Region"
  type        = string
}

variable "environment" {
  description = "Environment Name"
  type        = string
}

variable "project_name" {
  description = "Project Name"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Name of the AWS key pair for SSH access"
  type        = string
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
