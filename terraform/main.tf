provider "aws" {
  region = "us-east-1"
}

resource "aws_lambda_function" "hello_world" {
  function_name = "hello_world_lambda"
  s3_bucket     = "bucket-tfstates-postech-fiap-6soat"
  s3_key        = "lambda.zip"
  handler       = "index.js"
  runtime       = "nodejs18.x"
  role          = aws_iam_role.lambda_exec.arn

  environment {
    variables = {
      ENV_VAR = "value"
    }
  }

  tags = {
    Name = "hello-world-lambda"
  }
}

resource "aws_iam_role" "lambda_exec" {
  name = "lambda_exec_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
