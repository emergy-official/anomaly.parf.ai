#!/bin/bash
# run_terraform.sh

# Load environment variables from .env file
source .env

# Run the provided terraform command with variables
# terraform "$@" \
terraform "$@"
#     -var "mongodbatlas_public_key=$MONGODB_ATLAS_PUBLIC_KEY" \
#     -var "mongodbatlas_private_key=$MONGODB_ATLAS_PRIVATE_KEY" \
#     -var "mongodbatlas_app_dev_api_key=$DEV_MONGO_APP_API_KEY" \
#     -var "mongodbatlas_dev_user=$MONGODB_ATLAS_DEV_USER" \
#     -var "mongodbatlas_dev_password=$MONGODB_ATLAS_DEV_PASSWORD" \
#     -var "mongodbatlas_prod_user=$MONGODB_ATLAS_PROD_USER" \
#     -var "mongodbatlas_prod_password=$MONGODB_ATLAS_PROD_PASSWORD"
