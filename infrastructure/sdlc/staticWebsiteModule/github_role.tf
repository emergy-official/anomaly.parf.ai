resource "aws_iam_role_policy" "update_lambda_policy" {
  name = "${var.prefix}-update-lambda-policy"
  role = var.github_action_role_id
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "UpdateLambda",
        "Effect" : "Allow",
        "Action" : [
          "lambda:UpdateFunctionCode"
        ],
        "Resource" : [
          "${aws_lambda_function.anomaly_api.arn}"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "ecr_login_policy" {
  name = "${var.prefix}-ecr-login"
  role = var.github_action_role_id
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "ERCLogin",
        "Effect" : "Allow",
        "Action" : [
          "ecr:GetAuthorizationToken"
        ],
        "Resource" : "*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "s3_pull" {
  count = terraform.workspace == "dev" ? 1 : 0

  name = "${var.prefix}-s3-pull"
  role = var.github_action_role_id
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "s3pull",
        "Effect" : "Allow",
        "Action" : [
          "s3:GetObject",
          "s3:ListBucket"
        ],
        "Resource" : [
          aws_s3_bucket.artifacts[count.index].arn,
          "${aws_s3_bucket.artifacts[count.index].arn}/*"
        ]
      }
    ]
  })
}

// https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-push.html
resource "aws_iam_role_policy" "ecr_push_policy" {
  name = "${var.prefix}-ecr-push"
  role = var.github_action_role_id
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "ECRPush",
        "Effect" : "Allow",
        "Action" : [
          "ecr:CompleteLayerUpload",
          "ecr:GetAuthorizationToken",
          "ecr:UploadLayerPart",
          "ecr:InitiateLayerUpload",
          "ecr:BatchCheckLayerAvailability",
          "ecr:PutImage"
        ],
        "Resource" : "${aws_ecr_repository.python_scikit_learn.arn}"
      }
    ]
  })
}
