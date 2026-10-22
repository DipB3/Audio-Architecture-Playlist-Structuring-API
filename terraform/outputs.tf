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
  description = "Private S3 bucket containing the compiled React application"
  value       = aws_s3_bucket.frontend.id
}

output "frontend_cloudfront_distribution_id" {
  description = "CloudFront distribution ID used for cache invalidation after deployments"
  value       = aws_cloudfront_distribution.frontend.id
}

output "frontend_url" {
  description = "Public HTTPS URL for the React application"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}
