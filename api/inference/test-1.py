import requests  
import base64  
import json  
from PIL import Image, ImageDraw  
import matplotlib.pyplot as plt  
import numpy as np  
from io import BytesIO  

# The local path to your file

# The URL of your Flask API endpoint  
# url = 'http://localhost:8887/invocations'  
# url = 'http://127.0.0.1:9000/invocations'  
url = 'http://127.0.0.1:8080/invocations'  

def apply_exif_orientation(image):  
    """  
    Applies the EXIF Orientation to the image if present.  
    """  
    try:  
        exif = image._getexif()  
        orientation = exif.get(0x112, 1)  
  
        if orientation == 2:  
            image = image.transpose(Image.FLIP_LEFT_RIGHT)  
        elif orientation == 3:  
            image = image.rotate(180)  
        elif orientation == 4:  
            image = image.rotate(180).transpose(Image.FLIP_LEFT_RIGHT)  
        elif orientation == 5:  
            image = image.rotate(-90).transpose(Image.FLIP_LEFT_RIGHT)  
        elif orientation == 6:  
            image = image.rotate(-90)  
        elif orientation == 7:  
            image = image.rotate(90).transpose(Image.FLIP_LEFT_RIGHT)  
        elif orientation == 8:  
            image = image.rotate(90)  
    except AttributeError:  
        # _getexif is not available for all image types or the image does not have EXIF data  
        pass  
    return image

file_path = './20240417_134714.jpg'
# Open the file in binary mode and read its contents  
with open(file_path, 'rb') as image_file:  
    # Encode the image to base64  
    encoded_string = base64.b64encode(image_file.read()).decode('utf-8')  

img_data = base64.b64decode(encoded_string)  
image = Image.open(BytesIO(img_data))

image.save('image.png')  
  
  
# # Make the POST request  
# response = requests.post(url, data=data, headers=headers)  

# # If the request is successful, print the response  
# if response.status_code == 200:  
    
#     resp = response.json()
#     print("Success:")  
#     # print(response.json())  
    
#     img_data = base64.b64decode(resp["predictions"]["heatmap_image"])  
#     image = Image.open(BytesIO(img_data))  
#     image.save('image.png')  # or 'image.jpg' depending on the format  
# else:  
#     print("Error:", response.status_code)  
#     print(response.text)
    