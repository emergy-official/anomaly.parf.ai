FROM python:3.11.7  
  
WORKDIR /app  
  
# Copy the requirements file to use for pip installations  
COPY requirements.txt .  
  
# Update and install system dependencies including 'libgl1-mesa-glx',   
# 'portaudio19-dev' for PyAudio, 'build-essential' for compiling dependencies  
# and 'python3-pyaudio' as an optional dependency if you prefer to have it.  
RUN apt-get update && apt-get install -y \  
    libgl1-mesa-glx \  
    portaudio19-dev \  
    build-essential \  
    python3-pyaudio && \  
    rm -rf /var/lib/apt/lists/*  
  
# Install Python dependencies from requirements.txt  
RUN pip install --no-cache-dir -r requirements.txt  
  
# Copy your application files into the container  
COPY app.py ./  
COPY inference.py .  
COPY model.eim .

RUN chmod +x /app/model.eim  

# Set the entrypoint for the container  
ENTRYPOINT ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]  