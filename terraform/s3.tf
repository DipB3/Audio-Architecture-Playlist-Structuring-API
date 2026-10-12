# Amazon S3 Bucket for Audio Catalog Assets and Export Packages
resource "aws_s3_bucket" "audio_assets" {
  bucket        = local.s3_bucket_name
  force_destroy = true # Convenient for dev/testing cleanup

  tags = {
    Name = "AudioArchitecture-AssetBucket"
  }
}

# Block all public access for security best practices
resource "aws_s3_bucket_public_access_block" "audio_assets_pab" {
  bucket = aws_s3_bucket.audio_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable server-side encryption by default
resource "aws_s3_bucket_server_side_encryption_configuration" "audio_assets_sse" {
  bucket = aws_s3_bucket.audio_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lifecycle rule to prune old export bundles after 30 days and limit storage costs
resource "aws_s3_bucket_lifecycle_configuration" "audio_assets_lifecycle" {
  bucket = aws_s3_bucket.audio_assets.id

  rule {
    id     = "prune-old-exports"
    status = "Enabled"

    filter {
      prefix = "exports/"
    }

    expiration {
      days = 30
    }
  }
}
