# Infrastructure

## Introduction

The infrastructure is fully automated using Terraform.  
The project is hosted on AWS.

There's three accounts managing this project:
- INFRA
- DEV
- PROD

Those accounts are created automatically using the AWS SDK and are managed by an AWS Organisation. Only the code to automate the creation of the accounts is not available in this project.


## INFRA ACCOUNT
The `INFRA` account is responsible to manage `DEV` and `PROD` account's infrastructure securely.

Terraform state are stored within this account.

When Github is deploying to DEV or PROD account, it assume the deployment role of the INFRA account that allows it to assume the deployment role of the DEV or PROD account to proceed to the deployments. The role is behind strict permissions allowing only Github to operate for this application only.

If you'd like more information about it, contact me on [linkedin](https://www.linkedin.com/in/ml2/)