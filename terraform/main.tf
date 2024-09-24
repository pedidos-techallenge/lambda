provider "aws" {
  region = "us-east-1"
}

terraform {
  backend "s3" {}
}

resource "aws_lambda_function" "application_entry" {
  function_name = "application_entry"
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  role          = "arn:aws:iam::195169078299:role/LabRole"
  s3_bucket     = "bucket-tfstates-postech-fiap-6soat"
  s3_key        = "lambda.zip"

  environment {
    variables = {
      ENV_VAR = "value"
    }
  }

  tags = {
    Name = "pedidos-lambda"
  }
}

### General data sources
data "aws_vpc" "techchallenge-vpc" {
  filter {
    name   = "tag:Name"
    values = ["techchallenge-vpc"]
  }
}

resource "aws_security_group" "lambda_sg" {
  name        = "lambda_sg"
  description = "Security Group for Lambda function"
  vpc_id      = data.aws_vpc.techchallenge-vpc.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "lambda-security-group"
  }
}

# API Gateway
data "aws_api_gateway_rest_api" "api" {
  name = "ApplicationEntry"
}

# Create child resources under the existing primary resource
data "aws_api_gateway_resource" "pedidos_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.api.id
  path        = "/pedidos"
}

# Nested Resource /pedidos/application
resource "aws_api_gateway_resource" "application_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.api.id
  parent_id   = data.aws_api_gateway_resource.pedidos_resource.id # link it under /pedidos
  path_part   = "application"
}

# Method GET on /pedidos/application
resource "aws_api_gateway_method" "get_method" {
  rest_api_id   = data.aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.application_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

# API Gateway Integration with Lambda
resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.application_resource.id
  http_method             = aws_api_gateway_method.get_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.application_entry.invoke_arn
  credentials             = "arn:aws:iam::195169078299:role/LabRole"
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.application_entry.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${data.aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

# Deploy API Gateway
resource "aws_api_gateway_deployment" "api_deployment" {
  depends_on   = [aws_api_gateway_integration.lambda_integration, aws_lambda_permission.api_gateway_permission]
  rest_api_id  = data.aws_api_gateway_rest_api.api.id
  stage_name   = "prod"
}