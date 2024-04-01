
module "staticWebsite" {
  # Add a prefix
  prefix = "anomaly"
  # The relative path of the module
  source = "./staticWebsiteModule"
  # Share the workspace variable
  workspace = local.workspace
  # Set the domain name used for this module
  domain_name = local.workspace.subProjects.staticWebsite.domainName
  # Send the current user id
  aws_current_user_id = data.aws_canonical_user_id.current.id
  # Send the certificate ARN
  certificate_arn = aws_acm_certificate.cert.arn
  # api folder path
  api_path = "./../../api"
   # Send the current region name
  region_name = data.aws_region.current.name
  # Send the current user id
  aws_account_id = data.aws_caller_identity.current.account_id
  # Add permissions to the github action role
  github_action_role_id = aws_iam_role.github_action_role.id
}

output "cloudfront_record_ssrWebsite" {
  value = module.staticWebsite.cloudfront_record_website
}