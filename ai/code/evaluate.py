
import tensorflow as tf
import glob
import pandas as pd
from tqdm.auto import tqdm  
from tensorflow.keras.preprocessing.image import load_img, img_to_array  
import numpy as np  
import time
from edge_impulse_linux.image import ImageImpulseRunner
import cv2
import torch
import pickle
from efficientad_helper import *
from efficientad_inference import *
from sklearn.metrics import f1_score  
import psutil  
from IPython.display import display  

# Not very reliable to be honest, a nice way to have a glance of it.
# Having a browser, a second screen can affect this already, it is best to perform this remotely, havne't tried yet.
def process_memory():  
    """ Calculate the memory usage of the current process in KB. """  

    process = psutil.Process(os.getpid())  
    return process.memory_info().rss / 1024  # Return memory usage in KB  

def inference_baseline(model, image_path, img_height=160, img_width=160):
    """
    Perform model inference on a specific image using a baseline model.  
  
    Args:  
        model: The trained model for inference.  
        image_path: String. The path to the image on which inference is performed.  
        img_height: Int, optional. The height to which the image is resized. Default is 160.  
        img_width: Int, optional. The width to which the image is resized. Default is 160.  
  
    Returns:  
        tuple: Contains predicted class name, elapsed time in milliseconds, used memory in MB, and predicted probability.  
    """
    start_time = time.time()
    start_mem = process_memory()

    img = load_img(image_path, target_size=(img_height, img_width))  
    img_array = img_to_array(img)  
    img_array = np.expand_dims(img_array, axis=0)
    img_array /= 255.
      
    # Prediction  
    predictions = model.predict(img_array)  
    predicted_class = np.argmax(predictions, axis=1)  
    predicted_proba = np.max(predictions)  
  
    class_labels = ['anomaly','no_anomaly']
    predicted_class_name = class_labels[predicted_class[0]]  
    elapsed_time = (time.time() - start_time) * 1000 # Time in ms
    used_memory = process_memory() - start_mem # Memory used in MB
    
    return predicted_class_name, elapsed_time, used_memory, predicted_proba

def inference_baseline_ei(runner, img_path):  
    """
    Perform inference using an Edge Impulse runner on a specific image.  
  
    Args:  
        runner: The Edge Impulse runner instance.  
        img_path: String. The path to the image for inference.  
  
    Returns:  
        tuple: Contains classification result, elapsed time in milliseconds, used memory in MB, and score.  
    """ 
    start_time = time.time()  
    start_mem = process_memory()

    # with ImageImpulseRunner(modelfile) as runner:
    #     model_info = runner.init()
    original_image = cv2.imread(img_path, cv2.IMREAD_COLOR)  
    img = cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB)  
    
    features, cropped = runner.get_features_from_image(img)
    res = runner.classify(features)
    
    anomaly = res["result"]["classification"]["anomaly"]
    no_anomaly = res["result"]["classification"]["no_anomaly"]
    
    classification = "anomaly" if anomaly > no_anomaly else "no_anomaly"
    score = anomaly if anomaly > no_anomaly else no_anomaly

    elapsed_time = (time.time() - start_time) * 1000 # Time in ms
    used_memory = process_memory() - start_mem # Memory used in MB
    
    return classification, elapsed_time, used_memory, score

def inference_fomoad_ei(runner, img_path, threshold):  
    """
    Perform inference combining a form of anomaly detection based on a threshold.  
  
    Args:  
        runner: The Edge Impulse runner instance.  
        img_path: String. The path to the image for inference.  
        threshold: Float. The threshold value above which the image is classified as an anomaly.  
  
    Returns:  
        tuple: Contains classification result, elapsed time in milliseconds, used memory in MB, and anomaly score.  
    """  
    start_time = time.time()  
    start_mem = process_memory()
    
    original_image = cv2.imread(img_path, cv2.IMREAD_COLOR)  
    img = cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB)  
    
    features, cropped = runner.get_features_from_image(img)
    res = runner.classify(features)
    
    elapsed_time = (time.time() - start_time) * 1000 # Time in ms
    used_memory = process_memory() - start_mem # Memory used in MB
    
    classification = "anomaly" if res["result"]["visual_anomaly_max"] > threshold else "no_anomaly"
    
    return classification, elapsed_time, used_memory, res["result"]["visual_anomaly_max"]
    
    
def inference_efficientad(efficientad, image):   
    """
    Perform inference using the EfficientAD model.  
  
    Args:  
        efficientad: The EfficientAD inference object.  
        image: String. The path to the image for inference.  
  
    Returns:  
        tuple: Contains classification result, elapsed time in milliseconds, used memory in MB, and score.  
    """  
    start_time = time.time()
    
    score, cl, used_memory = efficientad.inference_by_image_path(image)
    elapsed_time = (time.time() - start_time) * 1000 # Time in ms
    
    return cl, elapsed_time, used_memory, score