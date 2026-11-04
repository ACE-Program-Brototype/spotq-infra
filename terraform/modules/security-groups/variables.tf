variable "security_group_name" {
  description = "Name of the security group"
  type        = string
}

variable "description" {
  description = "Description of the security group"
  type        = string
}

variable "allowed_ssh_cidr_blocks" {
  description = "List of IPv4 CIDR blocks permitted for SSH ingress"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
}
