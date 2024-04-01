# To note, the only manual text to change is the bucket name
# Here it is "818028758633-terraform-state-infra"

# Set the AWS Provider with an alias to the infra account
provider "aws" {
  region  = "us-east-1"
  profile = "818028758633"
}

# Get the current region
data "aws_region" "current" {}

# Bucket to store the state of the infra account
resource "aws_s3_bucket" "terraform-state-storage-s3-infra" {
  bucket   = "818028758633-terraform-state-infra--anomaly"

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Name = "S3 Remote Terraform State Store"
  }
}

# Bucket to store the state of the env account
resource "aws_s3_bucket" "terraform-state-storage-s3-env" {
  bucket   = "818028758633-terraform-state-env--anomaly"

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Name = "S3 Remote Terraform State Store"
  }
}

# Enable bucket versionning
resource "aws_s3_bucket_versioning" "versioning-terraform-storage-storage" {
  bucket = aws_s3_bucket.terraform-state-storage-s3-infra.id


  versioning_configuration {
    status = "Enabled"
  }
}
resource "aws_s3_bucket_versioning" "versioning-terraform-storage-env" {
  bucket = aws_s3_bucket.terraform-state-storage-s3-env.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Step 1. Uncomment this after the bucket is created
# Then run terraform init
terraform {
  backend "s3" {
    region  = "us-east-1"
    encrypt = true
    bucket  = "818028758633-terraform-state-infra--anomaly"
    key     = "terraform.tfstate"
    profile = "818028758633"
  }
}

