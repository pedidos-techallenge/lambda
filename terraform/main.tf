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

  environment {
    variables = {
      ENV_VAR = "value"
    }
  }

  tags = {
    Name = "hello-world-lambda"
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