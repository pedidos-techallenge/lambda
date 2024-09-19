provider "aws" {
  region = "us-east-1"
}

terraform {
  backend "s3" {}
}

resource "aws_lambda_function" "hello_world" {
  function_name = "hello_world"
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  role          = "arn:aws:iam::195169078299:role/LabRole"
  filename = "../lambda.zip"

  # lifecycle {
  #   prevent_destroy = true
  # }

  environment {
    variables = {
      ENV_VAR = "value"
    }
  }

  tags = {
    Name = "hello-world-lambda"
  }
}

# Data source to check if the security group already exists
data "aws_security_group" "lambda_sg" {
  filter {
    name   = "group-name"
    values = ["lambda_sg"]
  }

  filter {
    name   = "vpc-id"
    values = ["vpc-0e0d609eb36e1e778"]
  }
}

resource "aws_security_group" "lambda_sg" {
  count = length(data.aws_security_group.lambda_sg.id) == 0 ? 1 : 0

  name        = "lambda_sg"
  description = "Security Group for Lambda function"
  vpc_id      = "vpc-0e0d609eb36e1e778"

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

data "aws_api_gateway_rest_api" "api" {
  name = "HelloWorldAPI"
}

resource "aws_api_gateway_resource" "hello_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.api.id
  parent_id   = data.aws_api_gateway_rest_api.api.root_resource_id
  path_part        = "hello"
}

resource "aws_api_gateway_method" "get_method" {
  rest_api_id   = data.aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.hello_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

# API Gateway Integration with Lambda
resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.hello_resource.id
  http_method             = aws_api_gateway_method.get_method.http_method
  integration_http_method = "GET"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.hello_world.invoke_arn
  credentials             = "arn:aws:iam::195169078299:role/LabRole"
}

# Deploy API Gateway
resource "aws_api_gateway_deployment" "api_deployment" {
  depends_on = [aws_api_gateway_integration.lambda_integration]
  rest_api_id = data.aws_api_gateway_rest_api.api.id
  stage_name  = "prod"
}