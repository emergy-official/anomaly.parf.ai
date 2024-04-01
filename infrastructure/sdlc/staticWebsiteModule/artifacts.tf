
resource "aws_s3_bucket" "artifacts" {
  count = terraform.workspace == "dev" ? 1 : 0

  bucket = "artifact-${var.domain_name}"

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Name = "${var.domain_name} artifacts"
  }
}