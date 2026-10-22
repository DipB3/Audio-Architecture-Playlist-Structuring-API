output "api_gateway_endpoint" {
  description = "Public HTTP Invoke URL for the Audio Architecture API"
  value       = aws_apigatewayv2_stage.default_stage.invoke_url
}

output "lambda_function_name" {
  description = "Name of the serverless Audio Engine Lambda function"
  value       = aws_lambda_function.audio_engine.function_name
}

output "lambda_function_arn" {
  description = "ARN of the serverless Audio Engine Lambda function"
  value       = aws_lambda_function.audio_engine.arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table storing audio architectures and generation history"
  value       = aws_dynamodb_table.audio_architectures.name
}

output "s3_asset_bucket_name" {
  description = "Name of the Amazon S3 bucket storing exported playlist files"
  value       = aws_s3_bucket.audio_assets.id
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for audio engine telemetry"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "frontend_bucket_name" {
  description = "Reserved private S3 bucket for a future CloudFront frontend"
  value       = aws_s3_bucket.frontend.id
}
