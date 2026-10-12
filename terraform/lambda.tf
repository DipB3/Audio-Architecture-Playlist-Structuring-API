# Create ZIP archive from backend app source code
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend"
  output_path = "${path.module}/lambda_payload.zip"
  excludes = concat(
    tolist(fileset("${path.module}/../backend", "tests/**")),
    tolist(fileset("${path.module}/../backend", "requirements*.txt")),
    tolist(fileset("${path.module}/../backend", "**/__pycache__/**")),
    tolist(fileset("${path.module}/../backend", "app/data/saved_playlists/**")),
    tolist(fileset("${path.module}/../backend", "app/data/s3_local_exports/**"))
  )
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${local.name_prefix}-engine"
  retention_in_days = 14
}

# AWS Lambda Function: Audio Architecture Engine
resource "aws_lambda_function" "audio_engine" {
  function_name    = "${local.name_prefix}-engine"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "app.lambda_handler.handler"
  runtime          = "python3.11"
  memory_size      = 256
  timeout          = 30

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.audio_architectures.name
      S3_BUCKET_NAME      = aws_s3_bucket.audio_assets.id
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.attach_logging,
    aws_iam_role_policy_attachment.attach_dynamodb,
    aws_iam_role_policy_attachment.attach_s3,
    aws_cloudwatch_log_group.lambda_logs
  ]

  tags = {
    Name = "AudioArchitecture-LambdaEngine"
  }
}
