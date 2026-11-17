variable "instance_name" {
  type = string
}

variable "instance_type" {
  type = string
}

variable "key_name" {
  type = string
}

variable "security_group_id" {
  type = string
}

variable "instance_profile_name" {
  type    = string
  default = null
}

variable "instance_state" {
  description = "Target state of the EC2 instance ('running' or 'stopped')"
  type        = string
  default     = "running"
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

variable "ec2_log_group_name" {
  description = "CloudWatch log group name for EC2 system logs"
  type        = string
  default     = ""
}

variable "tags" {
  type = map(string)
}