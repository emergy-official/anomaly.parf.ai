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

# Make sure you have a model.kears
# Run the FLASK API
FLASK_APP=app.py flask run --port=8080

# On another terminal, test it
python local.py

# You can also test the inference endpoint if you have the credentials
python local-to-sagemaker-inference.py
```
