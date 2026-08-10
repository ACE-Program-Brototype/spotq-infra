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

variable "tags" {
  type = map(string)
}