FROM python:3.11.7

WORKDIR /app

COPY requirements.txt .

RUN apt-get update && apt-get install -y \  
    libgl1-mesa-glx \  
 && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py ./
COPY inference.py .
COPY model.keras .

ENTRYPOINT ["gunicorn", "-b", "0.0.0.0:8080", "app:app", "-n"]