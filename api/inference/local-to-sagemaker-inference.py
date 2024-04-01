# Import required libraries  
import boto3  # AWS SDK for Python  
import dotenv  # To load environment variables from a .env file  
from dotenv import load_dotenv  # Specific function to load environment variables  
import os  # To interact with the operating system  
import json  # To work with JSON data  
import base64  # To encode the image file  
  
# Load environment variables from a .env file  
load_dotenv()  
# Print the AWS region obtained from the environment variables for verification  
print(os.getenv('AWS_REGION'))  
  
# Initialize a boto3 client for Amazon SageMaker at runtime within the specified AWS region  
runtime_client = boto3.client('runtime.sagemaker', region_name="us-east-1")  
  
# Replace 'ENDPOINT_NAME' with your actual SageMaker endpoint name  
endpoint_name = 'test-endpoint' # Changed for readability  
# Specify the path to your image file that you want to send for prediction  
file_path = 'path/to/test-image.png'  # Example path changed for clarity  
  
# Open the image file in binary read mode  
with open(file_path, "rb") as image_file:  
    # Encode the image file content to base64 and decode it to utf-8  
    encoded_string = base64.b64encode(image_file.read()).decode('utf-8')  
  
# Create a JSON payload with the encoded image data  
data = json.dumps({'image': encoded_string})  
  
# Invoke the SageMaker endpoint with the JSON payload  
response = runtime_client.invoke_endpoint(EndpointName=endpoint_name,  
                                          ContentType='application/json',  # Specify content type as JSON  
                                          Body=data)  
  
# Parse and print the result returned by the SageMaker model  
result = json.loads(response['Body'].read().decode())  
print(result)  