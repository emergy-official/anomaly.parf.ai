from flask import Flask, request, jsonify  
from werkzeug.middleware.proxy_fix import ProxyFix  
import os  
from inference import load_model, predict

app = Flask(__name__)

# Load the model by reading the `SM_MODEL_DIR` environment variable
# which is passed to the container by SageMaker (usually /opt/ml/model).
model = load_model()

# Since the web application runs behind a proxy (nginx), we need to
# add this setting to our app.
app.wsgi_app = ProxyFix(
    app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1
)

@app.route("/ping", methods=["GET"])
def ping():
    """
    Healthcheck function.
    """
    print("Ping received")
    
    return "pong"

@app.route("/invocations", methods=["POST"])  
def invocations():  
    
    if request.content_type.startswith('application/json'):  
        content = request.get_json(silent=True)  
        if content and 'image' in content:  
            # Decode your image here  
            image_data = content['image']  
            # Do something with the image_data, like converting it back and feeding it to your model  
            predictions = predict(model, image_data)  # Update predict to handle base64 image data  
            return jsonify(predictions=predictions)  
        else:  
            return jsonify(error="No image provided"), 400  