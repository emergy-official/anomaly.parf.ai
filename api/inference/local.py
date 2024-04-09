import requests  
import base64  
import json  
from PIL import Image, ImageDraw  
import matplotlib.pyplot as plt  
import numpy as np  

# The local path to your file
file_path = './banana.jpg'

# The URL of your Flask API endpoint  
url = 'http://127.0.0.1:8080/invocations'  
  
# Open the file in binary mode and read its contents  
with open(file_path, 'rb') as image_file:  
    # Encode the image to base64  
    encoded_string = base64.b64encode(image_file.read()).decode('utf-8')  
# Prepare the JSON payload  
data = json.dumps({"image": encoded_string})  
# Set the appropriate headers for a JSON payload  
headers = {'Content-Type': 'application/json'}  
  
# Make the POST request  
response = requests.post(url, data=data, headers=headers)  

# If the request is successful, print the response  
if response.status_code == 200:  
    print("Success:")  
    print(response.json())  
else:  
    print("Error:", response.status_code)  
    print(response.text)
    