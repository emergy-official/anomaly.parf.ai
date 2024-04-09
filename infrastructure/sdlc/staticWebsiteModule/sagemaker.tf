
# Create role to allow github actions to perform actions on other buckets
resource "aws_iam_role" "sagemaker_role" {
  name = "${var.prefix}-sagemaker"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "sagemaker.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "sagemaker_full_access" {
  role       = aws_iam_role.sagemaker_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSageMakerFullAccess"
}

resource "aws_sagemaker_model" "api" {
  name = "${var.prefix}-api-model"

  execution_role_arn = aws_iam_role.sagemaker_role.arn

  primary_container {
    image = "${aws_ecr_repository.python_scikit_learn.repository_url}:latest" # Specify your model's Docker image  
  }
}

resource "aws_sagemaker_endpoint_configuration" "api" {
  name = "${var.prefix}-config"

  production_variants {
    variant_name = "${var.prefix}-api-1gb"
    model_name   = aws_sagemaker_model.api.name
    serverless_config {
      max_concurrency   = 1
      memory_size_in_mb = 1024
    }
  }
}


resource "aws_sagemaker_endpoint" "api" {
  name                 = "${var.prefix}-api"
  endpoint_config_name = aws_sagemaker_endpoint_configuration.api.name

  depends_on = [aws_sagemaker_endpoint_configuration.api]
}
