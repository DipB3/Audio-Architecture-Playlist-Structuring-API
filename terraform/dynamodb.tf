# Amazon DynamoDB Table for Audio Architectures and User History
resource "aws_dynamodb_table" "audio_architectures" {
  name         = local.dynamodb_table_name
  billing_mode = "PAY_PER_REQUEST" # Serverless on-demand, free-tier eligible ($0 baseline)
  hash_key     = "playlist_id"

  attribute {
    name = "playlist_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "S"
  }

  global_secondary_index {
    name            = "UserPlaylistIndex"
    hash_key        = "user_id"
    range_key       = "created_at"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "AudioArchitectures-Table"
  }
}
