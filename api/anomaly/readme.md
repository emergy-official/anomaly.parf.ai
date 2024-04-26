# Anomaly.parf.ai - Anomaly API

## Introduction

The anomaly API takes an image encoded in base64 as argument and returns the anomaly score, the classification and the base64 image including the heatmap.

This API is executed on AWS Lambda in the `NodeJS20.x` runtime.
It calls the Sagemaker serverless inference endpoint.

## API Usage example

- Prod: https://anomaly.parf.ai/api
- Dev: https://dev.anomaly.parf.ai/api

### Anomaly an image

```js
const request = require("request");
let options = {
  method: "POST",
  url: "https://anomaly.parf.ai/api/anomaly",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  }),
};
request(options, (error, response) => {
  if (error) throw new Error(error);
  console.log(response.body);
});
```

Response example

```json
{
  "predictions": {
    "classification": "anomaly",
    "heatmap_image": "...",
    "score": 1.18
  }
}
```

## How to test locally

```bash
# Go within the anomaly api
cd api/anomaly

# Install dependencies (using pnpm or npm, yarn, ...)
pnpm install

# Authentication to allow using DB queries and email sending
export DEV_ACCOUNT_ID=REPLACE_ME
export PROD_ACCOUNT_ID=REPLACE_ME
export INFRA_ACCOUNT_ID=REPLACE_ME
export ACCOUNT_ID=$DEV_ACCOUNT_ID

# Login from infra account to dev account
eval $(aws sts assume-role --profile $INFRA_ACCOUNT_ID --role-arn "arn:aws:iam::"$ACCOUNT_ID":role/provision" --role-session-name AWSCLI-Session | jq -r '.Credentials | "export AWS_ACCESS_KEY_ID=\(.AccessKeyId)\nexport AWS_SECRET_ACCESS_KEY=\(.SecretAccessKey)\nexport AWS_SESSION_TOKEN=\(.SessionToken)\n"')

# Run test
npm run test
```

If you need to build the lambda layer for the infrastructure and push it manually
```sh
# Go within the anomaly api
cd api/anomaly

# Create the lambda layer ready to be used by terraform
npm run prepare:layer
```
