````sh

ssh -i ~/.ssh/aws_parf_dev.pem ubuntu@54.90.97.27
sudo apt update
sudo apt install python3-pip python3-venv -y 
python3 -m venv mlflow-env

pip install mlflow boto3
source mlflow-env/bin/activate  

screen

export AWS_ACCESS_KEY_ID=
export AWS_SECRET_ACCESS_KEY=
export AWS_REGION=

http://54.90.97.27:5000/

mlflow server \
    --host 0.0.0.0 \
    --port 5000 \
    --artifacts-destination s3://artifact-dev.anomaly.parf.ai \
    --gunicorn-opts --timeout=300 \
    --gunicorn-opts --keep-alive=300

````

```sh
cd .. && rm -rf test
mkdir test && cd test
export S3_PATH="147127006715356410/97d96f08f23e444aa35a334ace90dc31"
aws s3 cp s3://artifact-dev.anomaly.parf.ai/$S3_PATH/artifacts/all_models.pth . 
aws s3 cp s3://artifact-dev.anomaly.parf.ai/$S3_PATH/artifacts/map_normalization.pth . 
aws s3 cp s3://artifact-dev.anomaly.parf.ai/$S3_PATH/artifacts/best_threshold.pkl .
```