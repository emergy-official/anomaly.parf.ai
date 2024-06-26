# Import standard libraries required for data handling and file I/O  
import base64  
import os
  
# Import data science and image processing libraries  
import numpy as np  
import cv2  
import base64  
from PIL import Image  
import io  
from torchvision import transforms
import torch
import pickle
import matplotlib.pyplot as plt  

# Initialize a transformer with specific transformations for preprocessing images  
# Resize the image to 256x256, convert it to tensor, and normalize it  
transformer = transforms.Compose([  
    transforms.Resize((256, 256)),  
    transforms.ToTensor(),  
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])  
])

# Load models and normalization maps from files using PyTorch  
models = torch.load(f"efficientad_cookies_3/all_models.pth", map_location=torch.device('cpu'))
map_normalization = torch.load("efficientad_cookies_3/map_normalization.pth", map_location=torch.device('cpu'))

# Load best threshold value for model operation using Pickle  
with open("efficientad_cookies_3/best_threshold.pkl", 'rb') as file:  
    best_threshold = pickle.load(file) 

teacher = models["teacher"]
teacher_mean = models["teacher_mean"]
teacher_std = models["teacher_std"]
student = models["student"]
autoencoder = models["autoencoder"]

q_st_start = map_normalization["q_st_start"]
q_st_end = map_normalization["q_st_end"]
q_ae_start = map_normalization["q_ae_start"]
q_ae_end = map_normalization["q_ae_end"]

@torch.no_grad()
def model_inference(model, encoded_string):  
    """  
    Perform model inference on the given image, process and display the results.  
    """
    print("ENCODED STRING", model)
    
    image_data = base64.b64decode(encoded_string)  
    image = Image.open(io.BytesIO(image_data))
    orientation = get_exif_orientation(image)
    # print("ORIENTATION", orientation)
    
    orig_width, orig_height = image.size
    image_transformed = transformer(image)  
    image_transformed = image_transformed[None]
    
    map_combined, map_st, map_ae = get_prediction(image_transformed)
    
    map_combined = torch.nn.functional.pad(
        map_combined, 
        (4, 4, 4, 4)
    )
    
    map_combined = torch.nn.functional.interpolate(  
        map_combined,   
        (orig_height, orig_width),   
        mode='bilinear',  
        align_corners=False  
    )  
        
    map_combined = map_combined[0, 0].cpu().numpy()  

    y_score_image = np.max(map_combined)
    
    classification = "anomaly" if y_score_image > best_threshold else "no_anomaly" 
        
    # print("", classification, y_score_image)
    
    heatmap_thresholded = np.where(map_combined > best_threshold, map_combined, 0)    
    
    # convert heatmap to image with colormap  
    heatmap_image = plt.cm.jet(heatmap_thresholded)  # Apply jet colormap  
    heatmap_image = (heatmap_image[:, :, :3] * 255).astype(np.uint8)  # Remove alpha channel and convert to uint8  
    heatmap_image = Image.fromarray(heatmap_image)  
    heatmap_image = heatmap_image.resize((512, 512))  
    result_image = Image.blend(image.resize((512, 512)), heatmap_image, alpha=0.5)

    if orientation:
        result_image = apply_exif_orientation(result_image, orientation)

    buffered = io.BytesIO()
    result_image.save(buffered, format="PNG")  
    result_image_64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
    
    
    return {"classification": classification, "score": float(y_score_image), "heatmap_image": result_image_64}

def apply_exif_orientation(image, orientation):  
    """  
    Applies the EXIF Orientation to the image if present.  
    """  
    try:  
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

def get_exif_orientation(image):  
    """  
    Get the EXIF Orientation to the image if present.  
    """  
    try:  
        orientation = ""
        exif = image._getexif()  
        orientation = exif.get(0x112, 1)  
    except AttributeError:  
        # _getexif is not available for all image types or the image does not have EXIF data  
        pass  
    return orientation 

def get_prediction(image):  
    teacher_output = teacher(image)  
    teacher_output = (teacher_output - teacher_mean) / teacher_std  
    student_output = student(image)  
    autoencoder_output = autoencoder(image)  
        
    map_st = torch.mean(  
        (teacher_output - student_output[:, :384])**2,  
        dim=1,  
        keepdim=True  
    )  
        
    map_ae = torch.mean(  
        (autoencoder_output - student_output[:, 384:])**2,  
        dim=1,   
        keepdim=True  
    )  
        
    if q_st_start is not None:  
        map_st = 0.1 * (map_st - q_st_start) / (q_st_end - q_st_start)  
        
    if q_ae_start is not None:  
        map_ae = 0.1 * (map_ae - q_ae_start) / (q_ae_end - q_ae_start)  
            
    map_combined = 0.5 * map_st + 0.5 * map_ae  
    return map_combined, map_st, map_ae
  
def load_model():  
    """  
    Load the model from disk, specifying custom objects required for the Dice coefficient and IoU metric.  
    """  
    model = "model.eim"
    return model

def predict(model, file_stream):  
    """  
    Perform prediction using the given model and image file stream, returning the prediction results.  
    """  
    return model_inference(model, file_stream)
