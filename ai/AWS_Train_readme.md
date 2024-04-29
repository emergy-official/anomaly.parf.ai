# AWS Setup command line

You can reuse some of the code below to create and install the instance using CLI.  
The instance used is g4dn.xlarge (0.526 USD per hour) with the AMI: `Deep Learning OSS Nvidia Driver AMI GPU PyTorch 2.2.0 (Ubuntu 20.04) 202404101`

You should terminate the instance (`aws ec2 terminate-instances`, more detailled below) to avoid paying for the storage when you don't use it


## Instance creation script

It will create a security group as well as the instance.
I'm using AWS ORG with multiple AWS accounts, you can remove the `OPTIONNAL` part for your usage
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

#### END OPTIONNAL

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
ssh -o StrictHostKeyChecking=no ubuntu@$PUBLIC_IP
```

### Useful CLI

Terminate any instance with the name stored in the variable `$INSTANCE_NAME`

```sh
aws ec2 terminate-instances --instance-ids $(aws ec2 describe-instances \
--filters "Name=tag:Name,Values=$INSTANCE_NAME" \
--query "Reservations[*].Instances[*].InstanceId" \
--output text)

aws ec2 delete-security-group --group-name $SSH_GROUP_NAME
```

Output instance name + ip running

```sh
aws ec2 describe-instances \
--query "Reservations[*].Instances[*].[Tags[?Key=='Name'].Value | [0], PublicIpAddress]" \
--output text \
--filters "Name=instance-state-name,Values=running"
```

## Prepare OS
```sh
# Now that you are logged in in SSH, you can run the below commands

sudo apt install zip
# Prepare conda
conda init bash
bash

conda activate /opt/conda/envs/pytorch

# Check if you CUDA is installed and ready for python
echo """
import torch
print(torch.cuda.is_available())
""" > test.py

python3 test.py
mkdir workspace
```

Now quit the instance and copy the different files from your local machine:
```sh
# From dl folder
scp EfficientADNew.zip ubuntu@44.200.180.25:/home/ubuntu/workspace

# Relogin
ssh ubuntu@3.91.187.172

cd workspace

git clone https://github.com/6be709c0/oc-ai-engineer.git
unzip EfficientADNew.zip

# The workspace is now ready
# Let's run the efficientAD cookie dataset
cd EfficientADNew

conda create -p venv python=3.9 -y
conda activate venv/
pip install -r requirements.txt

screen

python efficientad.py --dataset mvtec_ad -a my_dataset --subdataset cookies

# Optional > Testing if the toothbrush part is working as intented:
# python efficientad.py --dataset mvtec_ad -a my_dataset --subdataset toothbrush

apt-get in
zip -r output.zip output

# Exit the shell and from your local machine within the right directory to run the inference script

rm output.zip
rm -rf output

scp ubuntu@3.91.187.172:/home/ubuntu/workspace/EfficientADNew/output.zip .
unzip output.zip
rm output.zip

python inference.py -d my_dataset -obj cookies -f good
python inference.py -d my_dataset -obj cookies -f defective
```

## Jupyter in background

```bash

# On your local machine: Enable port forwarding through SSH
ssh -N -f -L 8888:localhost:8888 ubuntu@44.200.180.25

# On the remote machine: Run the following
conda activate /opt/conda/envs/pytorch
pip install jupyterlab

jupyter notebook --no-browser >jupyter.log 2>&1 &
cat jupyter.log
# Copy the token access token, you can now close the terminal if you want
# You can stop jupyter by doing as follow:
# pgrep jupyter
# kill (the number displayed after the pgrep)

# On your local machine: Stop port forwarding when you're done
pkill -f "ssh -N -f -L 8888:localhost:8888"  
```