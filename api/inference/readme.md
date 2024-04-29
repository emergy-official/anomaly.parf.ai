# Anomaly.parf.ai - Inference code

## Introduction

This is the code use by the Sagemaker Inference endpoint.

## How to test locally

```bash

# Go within the inference code
cd api/inference

# Install dependencies
conda create -p venv python=3.11.7 -y  
conda activate venv/     
pip install -r requirements.txt
# macos will need this cmd because docker install torch without GPU
# and can't have it in the requirements.txt: pip install torch torchvision torchaudio

# Make sure you have a model.kears
# Run the FLASK API
FLASK_APP=app.py flask run --port=8080

# On another terminal, test it
python local.py

# You can also test the inference endpoint if you have the credentials
python local-to-sagemaker-inference.py
```

## Build and deploy to AWS ERC
```sh
# Authentication
export DEV_ACCOUNT_ID=REPLACE_ME
export PROD_ACCOUNT_ID=REPLACE_ME
export INFRA_ACCOUNT_ID=REPLACE_ME
export ACCOUNT_ID=$DEV_ACCOUNT_ID

# Login from infra account to dev account
eval $(aws sts assume-role --profile $INFRA_ACCOUNT_ID --role-arn "arn:aws:iam::"$ACCOUNT_ID":role/c" --role-session-name AWSCLI-Session | jq -r '.Credentials | "export AWS_ACCESS_KEY_ID=\(.AccessKeyId)\nexport AWS_SECRET_ACCESS_KEY=\(.SecretAccessKey)\nexport AWS_SESSION_TOKEN=\(.SessionToken)\n"')

# Download the artifact for your model
aws s3 cp "s3://artifact-dev.sentiment.parf.ai/$FILE_PATH" ./ --recursive

# Login to AWS ECR to push docker
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin "$ACCOUNT_ID".dkr.ecr.us-east-1.amazonaws.com/

# Tag version image to latest
export IMG_VERSION=latest

# Build the image
docker build --platform linux/amd64 -t anomaly-inference-api:$IMG_VERSION .

# Tag the image so you can push it to AWS ECR (private repo)
docker tag anomaly-inference-api:$IMG_VERSION "$ACCOUNT_ID".dkr.ecr.us-east-1.amazonaws.com/anomaly-inference-api:latest

# Push the image
docker push "$ACCOUNT_ID".dkr.ecr.us-east-1.amazonaws.com/anomaly-inference-api:$IMG_VERSION
```
