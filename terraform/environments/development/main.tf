module "s3" {
  source = "../../modules/s3"

  bucket_name     = "${local.resource_prefix}-assets"
  allowed_origins = var.s3_allowed_origins
  tags            = local.common_tags
}

module "security" {
  source = "../../modules/security-groups"

  security_group_name     = "${local.resource_prefix}-sg"
  description             = "Security Group for SpotQ"
  allowed_ssh_cidr_blocks = var.allowed_ssh_cidr_blocks
  app_port                = var.app_port
  tags                    = local.common_tags
}

module "iam" {
  source = "../../modules/iam"

  role_name             = "${local.resource_prefix}-ec2-role"
  instance_profile_name = "${local.resource_prefix}-instance-profile"
  s3_bucket_arn         = module.s3.bucket_arn
  tags                  = local.common_tags
}

module "ec2" {
  source = "../../modules/ec2"

  instance_name         = "${local.resource_prefix}-ec2"
  instance_type         = var.instance_type
  key_name              = var.key_name
  security_group_id     = module.security.security_group_id
  instance_profile_name = module.iam.instance_profile_name
  tags                  = local.common_tags
}
