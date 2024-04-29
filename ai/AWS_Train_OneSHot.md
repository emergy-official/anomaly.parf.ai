
PART ONE
```sh
# The name you want to set to your model
export INSTANCE_NAME="ModelTraining"

# The key pair name you have created (here I use a .pem and will add it automatically.
# It should be stored in ~/.ssh/ or modify the code below
export KEY_PAIR="aws_parf_dev"
export SSH_GROUP_NAME="MANUAL_SSHAccess"

#### OPTIONNAL: IMPERSONATE DEV ACCOUNT

export DEV_ACCOUNT_ID=267341338450
export PROD_ACCOUNT_ID=258317103062
export INFRA_ACCOUNT_ID=818028758633
export ACCOUNT_ID=$DEV_ACCOUNT_ID
eval $(aws sts assume-role --profile "$INFRA_ACCOUNT_ID" --role-arn "arn:aws:iam::"$ACCOUNT_ID":role/provision" --role-session-name AWSCLI-Session | jq -r '.Credentials | "export AWS_ACCESS_KEY_ID=\(.AccessKeyId)\nexport AWS_SECRET_ACCESS_KEY=\(.SecretAccessKey)\nexport AWS_SESSION_TOKEN=\(.SessionToken)\n"')


export AWS_REGION=us-east-1

# Not need the pager for CLI comfort
export AWS_PAGER=""

echo "Creating the security group"
aws ec2 create-security-group --group-name $SSH_GROUP_NAME --description "Security group for SSH access from anywhere"
aws ec2 authorize-security-group-ingress --group-name $SSH_GROUP_NAME --protocol tcp --port 22 --cidr 0.0.0.0/0
SG_GROUP_ID=$(aws ec2 describe-security-groups --query "SecurityGroups[?GroupName=='$SSH_GROUP_NAME'].GroupId" --output text)

#### Supported EC2 instances: G4dn, G5, G6, Gr6, P4, P4de, P5. Release notes: https://docs.aws.amazon.com/dlami/latest/devguide/appendix-ami-release-notes.html
aws ec2 run-instances --image-id ami-0e4cc88070dfcf17b \
--instance-type g4dn.xlarge \
--key-name aws_parf_dev \
--security-group-ids $SG_GROUP_ID \
--block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":60}}]' \
--tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]"

echo "Starting instance, wait ~10sec..."
# Wait to let the instance start
sleep 10
PUBLIC_IP=$(aws ec2 describe-instances \
--filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=running" \
--query "Reservations[*].Instances[*].PublicIpAddress" \
--output text)

echo "The instance public IP is $PUBLIC_IP, connecting in ssh..."
sleep 1
ssh-add ~/.ssh/$KEY_PAIR.pem

ssh -L 2222:deeplearning:22 -N -f -L 8888:localhost:8888 ubuntu@$PUBLIC_IP

scp notebooks/datasets.zip ubuntu@$PUBLIC_IP:/home/ubuntu/
scp weights.zip ubuntu@$PUBLIC_IP:/home/ubuntu/
```


PART TWO
```sh
echo  ssh -o StrictHostKeyChecking=no ubuntu@$PUBLIC_IP
ssh -o StrictHostKeyChecking=no ubuntu@$PUBLIC_IP

source activate pytorch

git clone https://github.com/6be709c0/ai-anomaly-detection-cookies.git
sudo apt-get install zip

cd ai-anomaly-detection-cookies/notebooks

mv ../../datasets.zip .
unzip datasets.zip
rm datasets.zip

cd ..
mv ../weights.zip .
unzip weights.zip
rm weights.zip

pip install -r requirements/2_efficientad.txt
cd notebooks
pip install jupyterlab

screen

source activate pytorch
cd notebooks
jupyter lab
```

```sh

cd output
export NEW_NAME="steps_50_cookies_2"
mv 1/ $NEW_NAME
zip -r $NEW_NAME.zip $NEW_NAME
rm -rf $NEW_NAME

EC2_PUBLIC_IP=$(curl http://checkip.amazonaws.com)
echo "Copy this command locally"
echo scp ubuntu@$EC2_PUBLIC_IP:/home/ubuntu/ai-anomaly-detection-cookies/output/$NEW_NAME.zip .


# LOCAL
echo ""
echo $PUBLIC_IP
```