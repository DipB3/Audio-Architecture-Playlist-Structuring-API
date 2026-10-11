terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.30"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "AudioArchitectureSystem"
      Team        = "Team-6"
      Semester    = "5th-Semester"
      Batch       = "B2"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  }
}

resource "random_id" "suffix" {
  byte_length = 4
}

locals {
  name_prefix  = "${var.project_name}-${var.environment}"
  dynamodb_table_name = "${local.name_prefix}-architectures"
  s3_bucket_name      = "${local.name_prefix}-assets-${random_id.suffix.hex}"
}
