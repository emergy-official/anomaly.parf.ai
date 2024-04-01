# Create Lambda function to perform CRUD operations on DynamoDB table    
resource "aws_lambda_function" "anomaly_api" {
  function_name = "${var.prefix}_api"
  handler       = "index.handler"
  role          = aws_iam_role.lambda_exec_anomaly_api.arn
  runtime       = "nodejs20.x"
  filename      = data.archive_file.lambda_anomaly_zip.output_path
  # Do not update the lambda, it will be done by Github CI/CD
  source_code_hash = data.archive_file.lambda_anomaly_zip.output_base64sha256
  layers           = [aws_lambda_layer_version.lambda_anomaly_api_lambda_layer.arn]

  timeout     = 60
  memory_size = 128
  environment {
    variables = {
      INFERANCE_NAME = aws_sagemaker_endpoint.api.name
    }
  }
}

resource "aws_cloudwatch_log_group" "anomaly_api" {
  name              = "/aws/lambda/${aws_lambda_function.anomaly_api.function_name}"
  retention_in_days = 3
}

# IAM role for the Lambda function to access necessary resources  
resource "aws_iam_role" "lambda_exec_anomaly_api" {
  name = "${var.prefix}_lambda_exec_anomaly_api"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_exec_policy_anomaly_api" {
  name = "${var.prefix}_lambda_exec_policy_anomaly_api"
  role = aws_iam_role.lambda_exec_anomaly_api.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      },
    ]
  })
}

resource "aws_iam_role_policy" "lambda_exec_policy_anomaly_api_db" {
  name = "${var.prefix}_lambda_exec_sagemaker_endpoint"
  role = aws_iam_role.lambda_exec_anomaly_api.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "sagemaker:InvokeEndpoint",
        ]
        Effect   = "Allow"
        Resource = aws_sagemaker_endpoint.api.arn
      },
    ]
  })
}

resource "aws_iam_role_policy" "lambda_exec_policy_anomaly_api_metrics" {
  name = "${var.prefix}_lambda_exec_policy_anomaly_api_metrics"
  role = aws_iam_role.lambda_exec_anomaly_api.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
    ]
  })
}

resource "aws_lambda_permission" "api_gateway_anomaly" {
  statement_id  = "AllowAPIGatewayInvokeanomaly"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.anomaly_api.arn
  principal     = "apigateway.amazonaws.com"

  # If you have set up an AWS Account Alias, use this line instead  
  # source_arn = "arn:aws:execute-api:${var.region_name}:${var.aws_account_id}:${aws_api_gateway_rest_api.example.id}/${aws_api_gateway_deployment.example.stage_name}/ANY/RESOURCE_PATH"  

  source_arn = "arn:aws:execute-api:${var.region_name}:${var.aws_account_id}:${aws_api_gateway_rest_api.website.id}/*/*/*"
}

# Code of the lambda functions
data "archive_file" "lambda_anomaly_zip" {
  type        = "zip"
  source_dir  = "${var.api_path}/dist/anomaly-lambda"
  output_path = "${var.api_path}/dist/anomaly-lambda.zip"
}


# Code of the lambda layer
data "archive_file" "lambda_anomaly_api_lambda_layer" {
  type        = "zip"
  source_dir  = "${var.api_path}/dist/nodejs"
  output_path = "${var.api_path}/dist/nodejs.zip"
}

# Create the Lambda layer  
resource "aws_lambda_layer_version" "lambda_anomaly_api_lambda_layer" {
  layer_name          = "${var.prefix}_anomaly_lambda_layer"
  filename            = data.archive_file.lambda_anomaly_api_lambda_layer.output_path
  source_code_hash    = filebase64sha256(data.archive_file.lambda_anomaly_api_lambda_layer.output_path)
  compatible_runtimes = ["nodejs20.x"]
}

resource "aws_sns_topic" "negative_anomaly_alarm_topic" {  
  name = "${var.prefix}-negative-anomaly-alarm-topic"  
}