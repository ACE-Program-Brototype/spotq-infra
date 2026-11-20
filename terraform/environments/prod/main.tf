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

  instance_name           = "${local.resource_prefix}-ec2"
  instance_type           = var.instance_type
  instance_state          = var.instance_state
  key_name                = var.key_name
  security_group_id       = module.security.security_group_id
  instance_profile_name   = module.iam.instance_profile_name
  cloudflare_tunnel_token = var.cloudflare_tunnel_token
  infisical_token         = var.infisical_token
  ec2_log_group_name      = "/${var.project_name}/${var.environment}/ec2"
  tags                    = local.common_tags
}

module "sns" {
  source      = "../../modules/sns"
  topic_name  = "${var.project_name}-${var.environment}-alerts"
  alert_email = var.alert_email
  tags        = local.common_tags
}

module "cloudwatch" {
  source                           = "../../modules/cloudwatch"
  log_group_name                   = "/${var.project_name}/${var.environment}/ec2"
  ec2_log_retention_days           = var.ec2_log_retention_days
  microservices_log_retention_days = var.microservices_log_retention_days
  instance_id                      = module.ec2.instance_id
  root_volume_id                   = module.ec2.root_volume_id
  project_name                     = var.project_name
  environment                      = var.environment
  alarm_actions                    = concat([module.sns.topic_arn], var.alarm_actions)
  tags                             = local.common_tags
}
