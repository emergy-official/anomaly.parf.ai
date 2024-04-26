# Website

## Introduction

- Using [AstroWind](https://astrowind.vercel.app/) as template,
- Contains a compressed version of [mobile-client](https://github.com/edgeimpulse/mobile-client/tree/master/client) from Edge Impulse.

### How to run

```sh
npm install
npm run dev
```

### Mobile Client compressed version detail:

- Require the [smartphone folder](public/smartphone)
- Three files in the [edge-impulse](src/utils/edge-impulse) folder
    - zip.astro (the zip.js librairy)
    - classifier.ts - The original one untouched
    - utils.ts - a few function reused and some created
- [realtime.ts](src/utils/realtime.ts) Functions to use for the realtime score to be displayed as well as the fun jet colormap modification.
- [CameraCanvas.tsx](src/components/react/CameraCanvas.tsx) From the useEffect function, it loads the /model.zip. This is where the front page is displayed.

[Contact me](https://www.linkedin.com/in/ml2/) if you want more details.

### datasets deployments

To deploy the datasets, run the following command to publish the datasets in the website:

```sh
# Authentication
export DEV_ACCOUNT_ID=REPLACE_ME
export PROD_ACCOUNT_ID=REPLACE_ME
export INFRA_ACCOUNT_ID=REPLACE_ME
export ACCOUNT_ID=$DEV_ACCOUNT_ID

# Login from infra account to dev account
eval $(aws sts assume-role --profile $INFRA_ACCOUNT_ID --role-arn "arn:aws:iam::"$ACCOUNT_ID":role/c" --role-session-name AWSCLI-Session | jq -r '.Credentials | "export AWS_ACCESS_KEY_ID=\(.AccessKeyId)\nexport AWS_SECRET_ACCESS_KEY=\(.SecretAccessKey)\nexport AWS_SESSION_TOKEN=\(.SessionToken)\n"')

aws s3 cp website/public/datasets "s3://dev.anomaly.parf.ai/datasets" --recursive
aws s3 cp website/public/datasets "s3://anomaly.parf.ai/datasets" --recursive

```