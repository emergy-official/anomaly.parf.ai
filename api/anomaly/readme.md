# Segment.parf.ai - Segment API

## Introduction

The segment API takes an image encoded in base64 as argument and returns the mask
You can either get the latest 20 feedbacks or submit a feedback.

This API is executed on AWS Lambda in the `NodeJS20.x` runtime.
It calls the Sagemaker serverless inference endpoint.

Using free tier, the first execution will take ~3sec time as well as ~10sec for the inference endpoint too (reserved concurrency lambda makes it always available for some $$)

The response time should be ~2s per request after coldstart.

## API Usage example

- Prod: https://segment.parf.ai/api
- Dev: https://dev.segment.parf.ai/api

### Segment an image

```js
const request = require("request");
let options = {
  method: "POST",
  url: "https://segment.parf.ai/api/segment",
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
    "base64_image": "...",
    "polygons_json": {
      "<cat>": [<pixelInt>]
    },
  }
}
```

## How to test locally

```bash
# Go within the segment api
cd api/segment

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
# Go within the segment api
cd api/segment

# Create the lambda layer ready to be used by terraform
npm run prepare:layer
```

## Structure

**Scripts and Configuration Files**

- **segment.test.ts**: Unit test
- **getFeedbacks.ts**: Script to gather feedbacks within DynamoDB
- **helper.ts**: Reusable functions to share accross other scripts.
- **index.ts**: Script invoked by the API

**Configuration and Package Management**
- **package.json**: Libraries used
- **pnpm-lock.yaml**: By PNPM to reuse the same versions
- **tsconfig.json**: Typescript config
- **test.png**: Test image
