resource "aws_acm_certificate" "cert" {
  domain_name               = local.workspace.subProjects.staticWebsite.domainName
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

output "certificate_validation" {
  value = aws_acm_certificate.cert.domain_validation_options
}

output "certificate_validation_arn" {
  value = aws_acm_certificate.cert.arn
}
