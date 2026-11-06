variable "role_name" {
  description = "IAM Role Name"
  type        = string
}

variable "instance_profile_name" {
  description = "IAM Instance Profile Name"
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN of the target S3 bucket for scoped access"
  type        = string
}

variable "tags" {
  description = "Common Tags"
  type        = map(string)
}
