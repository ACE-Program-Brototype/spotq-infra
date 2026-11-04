module "s3" {

  source = "../../modules/s3"

  bucket_name = "${local.resource_prefix}-assets"

  tags = local.common_tags

}

module "security" {

  source = "../../modules/security-groups"

  security_group_name = "${local.resource_prefix}-sg"

  description = "Security Group for SpotQ"

  tags = local.common_tags
}

module "iam" {

  source = "../../modules/iam"

  role_name = "${local.resource_prefix}-ec2-role"

  instance_profile_name = "${local.resource_prefix}-instance-profile"

  tags = local.common_tags
}

module "ec2" {

  source = "../../modules/ec2"

  instance_name = "${local.resource_prefix}-ec2"

  instance_type = "t3.micro"

  key_name = "spotq-dev-key"

  security_group_id = module.security.security_group_id

  instance_profile_name = module.iam.instance_profile_name

  tags = local.common_tags

}