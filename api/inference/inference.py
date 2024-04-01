# Import standard libraries required for data handling and file I/O  
import io  
import base64  
import joblib  
  
# Import data science and image processing libraries  
import numpy as np  
from PIL import Image  
import cv2  
import tensorflow as tf  
from tensorflow.keras import backend as K  
import matplotlib.pyplot as plt  

def dice_coef(y_true, y_pred, smooth=1e-6):  
    """  
    Calculate the Dice Coefficient for measuring the similarity between two samples.  
    """  
    y_true_f = K.flatten(y_true)  
    y_pred_f = K.flatten(y_pred)  
    intersection = K.sum(y_true_f * y_pred_f)  
    return (2. * intersection + smooth) / (K.sum(y_true_f) + K.sum(y_pred_f) + smooth)  
  
def iou(y_true, y_pred, smooth=1e-6):  
    """  
    Calculate the Intersection over Union (IoU) between the true and predicted values.  
    """  
    intersection = K.sum(K.abs(y_true * y_pred), axis=[1, 2, 3])  
    union = K.sum(y_true, [1, 2, 3]) + K.sum(y_pred, [1, 2, 3]) - intersection  
    return K.mean((intersection + smooth) / (union + smooth), axis=0)  
  
def read_image(base64_str):  
    """  
    Read an image from a base64 encoded string, preprocess it, and return along with its original size.  
    """  
    img_bytes = base64.b64decode(base64_str)  
    img_arr = np.frombuffer(img_bytes, dtype=np.uint8)  
    original_image = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)  
    original_height, original_width = original_image.shape[:2]  
  
    resized_image = cv2.resize(original_image, (512, 256))  
    resized_image = resized_image / 255.0  
    resized_image = resized_image.astype(np.float32)  
    resized_image = cv2.cvtColor(resized_image, cv2.COLOR_BGR2RGB)  
    return resized_image, (original_height, original_width)  
  
def model_inference(model, base64_image):  
    """  
    Perform model inference on the given image, process and display the results.  
    """  
    image, original_size = read_image(base64_image)  
    image_to_predict = np.expand_dims(image, axis=0)  
    prediction = model.predict(image_to_predict)  
      
    # Extract the most probable prediction for each pixel  
    predicted_mask = tf.argmax(prediction, axis=-1)[0].numpy()  
    predicted_mask = tf.image.resize(predicted_mask[..., tf.newaxis], original_size, method='nearest').numpy().astype(np.uint8)[:, :, 0]  
  
    # Normalize and colorize the mask for visualization  
    predicted_mask_normalized = predicted_mask.astype('float32') / predicted_mask.max()  
    colored_mask = plt.get_cmap('viridis')(predicted_mask_normalized)[:, :, :3]  # Exclude alpha channel  
    colored_mask = (colored_mask * 255).astype(np.uint8)  
  
    # Convert the color mask to a PIL Image and then to a base64 encoded PNG  
    mask_image = Image.fromarray(colored_mask)  
    buffered = io.BytesIO()  
    mask_image.save(buffered, format="PNG")
    
    # If you want to test locally and save the img directly
    # mask_image.save("mask-result.png") 
    
    image_png_bytes = buffered.getvalue()  
    base64_image = base64.b64encode(image_png_bytes).decode("utf-8")  
  
    # Initialize and populate the dictionary for label polygons  
    labels_polygons = { 'void': [], 'flat': [], 'construction': [], 'object': [], 'nature': [], 'sky': [], 'human': [], 'vehicle': [] }  
    
    # MASK TO POLYGONS
    # Loop through each polygon label and get the index (void = 0)
    # Find the pixel related to that label index
    # Find the contours of those
    # Return the polygons per category
    for label, _ in labels_polygons.items():  
        label_index = list(labels_polygons.keys()).index(label)    
        mask = (predicted_mask == label_index).astype(np.uint8) * 255  
  
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)  
        for contour in contours:  
            approx = contour.flatten().tolist()  
            labels_polygons[label].append(approx)  
  
    return {"base64_image": base64_image, "polygons_json": labels_polygons}  
  
def load_model():  
    """  
    Load the model from disk, specifying custom objects required for the Dice coefficient and IoU metric.  
    """  
    return tf.keras.models.load_model("model.keras", custom_objects={'dice_coef': dice_coef, 'iou': iou})  
  
def predict(model, file_stream):  
    """  
    Perform prediction using the given model and image file stream, returning the prediction results.  
    """  
    return model_inference(model, file_stream)