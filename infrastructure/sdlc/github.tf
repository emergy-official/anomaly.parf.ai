
# Create role to allow github actions to perform actions on other buckets
resource "aws_iam_role" "github_action_role" {
  name = "github-${terraform.workspace}--anomaly"
  # Terraform's "jsonencode" function converts a
  # Terraform expression result to valid JSON syntax.
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow"
        Sid    = "RoleForGitHubActions",
        Principal = {
          "AWS" = local.workspace.githubActionsRoleSTSARN
        }
        Condition = {
        }
      }
    ]
  })
}

# Allow github to perform actions on other buckets
resource "aws_iam_role_policy" "github_actions_policy" {
  name = "github-policy--anomaly"
  role = aws_iam_role.github_action_role.id
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "PutObjectsInBucket",
        "Effect" : "Allow",
        "Action": [
            "s3:PutObject",
            "s3:PutObjectAcl"
        ],
        "Resource": "arn:aws:s3:::*"
      }
    ]
  })
}

# Allow to create invalidation on cloudfront
resource "aws_iam_role_policy" "cloudfront_policy" {
  name = "cloudfront-policy--anomaly"
  role = aws_iam_role.github_action_role.id
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "InvalidateCloudfront",
        "Effect" : "Allow",
        "Action": [
            
            "cloudfront:CreateInvalidation",
        ],
        "Resource": "*"
      },
      {
        "Sid" : "ListDistributionCloudfront",
        "Effect" : "Allow",
        "Action": [
            "cloudfront:ListDistributions",
        ],
        "Resource": "*"
      }
    ]
  })
}
