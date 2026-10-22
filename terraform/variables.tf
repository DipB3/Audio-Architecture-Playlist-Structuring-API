variable "aws_region" {
  description = "AWS region to deploy cloud resources into"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "audio-architecture-api"
}

variable "budget_limit_usd" {
  description = "Monthly budget limit in USD to trigger alerts (Guideline 7: Budget Caution)"
  type        = string
  default     = "5.0"
}

variable "api_throttle_rate_limit" {
  description = "Steady-state API Gateway request limit per second for all routes"
  type        = number
  default     = 5
}

variable "api_throttle_burst_limit" {
  description = "Maximum concurrent API Gateway request burst for all routes"
  type        = number
  default     = 10
}

variable "budget_alert_emails" {
  description = "List of email addresses to receive cloud budget overrun notifications"
  type        = list(string)
  default = [
    "vaibhav.bhatia@learner.manipal.edu",
    "pratham.shah@learner.manipal.edu",
    "dipankar.banerjee@learner.manipal.edu"
  ]
}
