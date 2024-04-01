import requests  
import base64  
import json  
from PIL import Image, ImageDraw  
import matplotlib.pyplot as plt  
import numpy as np  

# The local path to your file
file_path = './test.png'

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
    print(response.json()["predictions"]["base64_image"])  
else:  
    print("Error:", response.status_code)  
    print(response.text)
    
# Draw the polygon to an Image
labels_polygons = response.json()["predictions"]["polygons_json"]

original_image = Image.open(file_path)  
image_width, image_height = original_image.size  

# Create a blank image with the same size as the original and with RGBA mode  
mask_image = Image.new('RGBA', (image_width, image_height), (0, 0, 0, 0))
draw = ImageDraw.Draw(mask_image) 

# Generate colors from the viridis colormap for the number of labels  
num_labels = len(labels_polygons.keys())  
cmap = plt.get_cmap('viridis')  
colors = [cmap(i/num_labels)[:3] for i in range(num_labels)]  # get RGB part  
colors = [(int(r*255), int(g*255), int(b*255)) for r, g, b in colors]  # Convert to 0-255 scale  
  
# Assign a color to each label  
label_colors = dict(zip(labels_polygons.keys(), colors))  
  
def draw_polygons(draw, labels_polygons, label_colors):  
    for label, polygons in labels_polygons.items():  
        color = label_colors.get(label)
        for polygon in polygons:  
            draw.polygon(polygon, outline=color, fill=color)  

# Draw the polygons on the mask  
draw_polygons(draw, labels_polygons, label_colors)  
  
# Save the mask image and the combined image  
mask_image.save("mask.png")