variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
}

variable "allowed_origins" {
  description = "List of allowed origins for S3 bucket CORS policy"
  type        = list(string)
  default     = ["*"]
}
