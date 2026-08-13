resource "aws_iam_role" "ec2_role" {

  name = var.role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "ec2.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.tags
}


resource "aws_iam_role_policy_attachment" "s3_access" {

  role = aws_iam_role.ec2_role.name

  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"

}


resource "aws_iam_instance_profile" "ec2_profile" {

  name = var.instance_profile_name

  role = aws_iam_role.ec2_role.name

}