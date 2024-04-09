# Import standard libraries required for data handling and file I/O  
import base64  
import os
  
# Import data science and image processing libraries  
import numpy as np  
import cv2  
from edge_impulse_linux.image import ImageImpulseRunner

def model_inference(model, encoded_string):  
    """  
    Perform model inference on the given image, process and display the results.  
    """  
    with ImageImpulseRunner(model) as runner:  
        try:  
            model_info = runner.init()  
            print('Loaded runner for "' + model_info['project']['owner'] + ' / ' + model_info['project']['name'] + '"')  
            labels = model_info['model_parameters']['labels']  
  
            img_bytes = base64.b64decode(encoded_string)  
            img_arr = np.frombuffer(img_bytes, dtype=np.uint8)  
            original_image = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)  
            img = cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB)  # Convert to RGB  
  
            features, cropped = runner.get_features_from_image(img)  
            res = runner.classify(features)  
  
            highest_score_label = None  
            highest_score = 0  
  
            if "classification" in res["result"].keys():  
                for label, score in res['result']['classification'].items():  
                    if score > highest_score:  
                        highest_score_label = label  
                        highest_score = score  
  
                return {"label": highest_score_label, "score": highest_score}    
  
            elif "bounding_boxes" in res["result"].keys():  
                # Assuming you only care about classification result for this function  
                pass  
  
        finally:  
            runner.stop()
  
def load_model():  
    """  
    Load the model from disk, specifying custom objects required for the Dice coefficient and IoU metric.  
    """  
    model = "model.eim"
    dir_path = os.path.dirname(os.path.realpath(__file__))
    modelfile = os.path.join(dir_path, model)
    print("modelfile", modelfile)
    return modelfile

def predict(model, file_stream):  
    """  
    Perform prediction using the given model and image file stream, returning the prediction results.  
    """  
    return model_inference(model, file_stream)
