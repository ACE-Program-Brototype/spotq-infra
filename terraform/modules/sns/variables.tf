variable "topic_name" {
  description = "Name of the SNS topic"
  type        = string
}

variable "alert_email" {
  description = "Email address to subscribe to the SNS topic"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
