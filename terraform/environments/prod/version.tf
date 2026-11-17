terraform {
  required_version = ">= 1.9.0, < 2.0.0"

  backend "s3" {
    bucket       = "spotq-terraform-state-911151044878"
    key          = "prod/terraform.tfstate"
    region       = "ap-southeast-2"
    encrypt      = true
    use_lockfile = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
