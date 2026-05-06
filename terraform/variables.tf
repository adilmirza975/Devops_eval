variable "aws_region" {
  description = "The AWS region to deploy resources in"
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  default     = "shopsmartrevised"
}

variable "image_tag" {
  description = "The tag of the Docker image to deploy"
  default     = "latest"
}

variable "db_username" {
  description = "Database administrator username"
  default     = "dbadmin"
}

variable "db_password" {
  description = "Database administrator password"
  sensitive   = true
  default     = "ShopSmart123!"
}
