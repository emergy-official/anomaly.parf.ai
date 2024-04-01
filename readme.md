# Segment.parf.ai

![](./segment-1.png)

## Introduction

This project demonstrate semantic segmentation of city street images.

- **PROD**: https://segment.parf.ai/
- **DEV**: https://dev.segment.parf.ai/

## Structure

- **.github**: Automated deployments
- **api**: All the code used for the API
- **infrastructure**: The terraform infrastructure (everything is automated)
- **website**: All the code related to the website

```sh
# Authentication
export DEV_ACCOUNT_ID=REPLACE_ME
export PROD_ACCOUNT_ID=REPLACE_ME
export INFRA_ACCOUNT_ID=REPLACE_ME
export ACCOUNT_ID=$DEV_ACCOUNT_ID

# Login from infra account to dev account
eval $(aws sts assume-role --profile $INFRA_ACCOUNT_ID --role-arn "arn:aws:iam::"$ACCOUNT_ID":role/provision" --role-session-name AWSCLI-Session | jq -r '.Credentials | "export AWS_ACCESS_KEY_ID=\(.AccessKeyId)\nexport AWS_SECRET_ACCESS_KEY=\(.SecretAccessKey)\nexport AWS_SESSION_TOKEN=\(.SessionToken)\n"')

# Download the artifact
rm -rf artifacts
export FILE_PATH="657967221979013195/2f2f781caad24db9bbc386eef1fbde7b"
aws s3 cp "s3://artifact-dev.sentiment.parf.ai/$FILE_PATH" ./ --recursive

# Login to AWS ECR to push docker
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin "$ACCOUNT_ID".dkr.ecr.us-east-1.amazonaws.com/

# Tag version image to latest
export IMG_VERSION=latest

# Logout to the public ECR to make sure that the private publish won't fail
docker logout public.ecr.aws

# Build the image
docker build --platform linux/amd64 -t python-scikit-learn:$IMG_VERSION .

# Tag the image so you can push it to AWS ECR (private repo)
docker tag python-scikit-learn:$IMG_VERSION "$ACCOUNT_ID".dkr.ecr.us-east-1.amazonaws.com/anomaly-inference-api:latest

# Push the image
docker push "$ACCOUNT_ID".dkr.ecr.us-east-1.amazonaws.com/anomaly-inference-api:latest
````
