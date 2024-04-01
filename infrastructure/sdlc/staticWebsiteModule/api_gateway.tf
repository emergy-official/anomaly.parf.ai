
resource "aws_api_gateway_rest_api" "website" {
  name = "${var.prefix}-api-gateway"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_deployment" "website" {
  rest_api_id = aws_api_gateway_rest_api.website.id
  stage_name  = "api"
}

// anomaly
resource "aws_api_gateway_resource" "anomaly" {
  rest_api_id = aws_api_gateway_rest_api.website.id
  parent_id   = aws_api_gateway_rest_api.website.root_resource_id
  path_part   = "anomaly"
}

resource "aws_api_gateway_method" "anomaly" {
  rest_api_id   = aws_api_gateway_rest_api.website.id
  resource_id   = aws_api_gateway_resource.anomaly.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "anomaly" {
  rest_api_id             = aws_api_gateway_rest_api.website.id
  resource_id             = aws_api_gateway_resource.anomaly.id
  http_method             = aws_api_gateway_method.anomaly.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${aws_lambda_function.anomaly_api.arn}/invocations"
}

# CORS (Localhost usage)

resource "aws_api_gateway_method" "anomaly_options" {
  rest_api_id   = aws_api_gateway_rest_api.website.id
  resource_id   = aws_api_gateway_resource.anomaly.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "anomaly_options" {
  depends_on              = [aws_api_gateway_integration.anomaly]
  rest_api_id             = aws_api_gateway_rest_api.website.id
  resource_id             = aws_api_gateway_resource.anomaly.id
  http_method             = aws_api_gateway_method.anomaly_options.http_method
  type                    = "MOCK"

  request_templates = {
    "application/json" = <<EOF
{"statusCode": 200}
EOF
  }
}

resource "aws_api_gateway_method_response" "anomaly_options" {
  rest_api_id = aws_api_gateway_rest_api.website.id
  resource_id = aws_api_gateway_resource.anomaly.id
  http_method = aws_api_gateway_method.anomaly_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "anomaly_options" {
  depends_on  = [aws_api_gateway_integration.anomaly_options, aws_api_gateway_method_response.anomaly_options]
  rest_api_id = aws_api_gateway_rest_api.website.id
  resource_id = aws_api_gateway_resource.anomaly.id
  http_method = aws_api_gateway_method.anomaly_options.http_method
  status_code = aws_api_gateway_method_response.anomaly_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}


output "api_gateway_invoke_url" {
  value       = aws_api_gateway_deployment.website.invoke_url
  description = "API Gateway Deployment Invoke URL"
}

output "api_gateway_id" {
  value       = aws_api_gateway_rest_api.website.id
  description = "API Gateway Deployment ID"
}
