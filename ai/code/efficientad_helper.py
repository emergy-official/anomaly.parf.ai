# Standard library imports for system operations and file management  
import os  
import shutil  
import glob  
import pickle  
import time  
import itertools  
import random  
import argparse   
  
# Numeric and scientific computation libraries  
import numpy as np  
  
# Deep Learning and machine learning libraries  
import torch  
from torch.utils.data import DataLoader  
from torchvision import transforms  
from sklearn.model_selection import train_test_split    
from sklearn.metrics import roc_auc_score, confusion_matrix, f1_score, roc_curve  
  
# Image processing and file I/O libraries  
import tifffile  
from PIL import Image  
  
# Visualization library  
import matplotlib.pyplot as plt    
  
# Progress bar utility  
from tqdm import tqdm  
  
# ML Experiment tracking utility  
import mlflow  
  
# Local/custom model import  
from efficientad_models import *

def InfiniteDataloader(loader):  
    """   
    Provides an infinite loop over an iterable data loader.  
      
    Args:  
        loader: Iterable data loader from which data will be yielded continuously.  
    """  
    iterator = iter(loader)
    while True:
        try:
            yield next(iterator)
        except StopIteration: # Restart the iterator when the data is exhausted. 
            iterator = iter(loader)

class ImageTransforms:  
    """   
    Prepares image transformations for training and autoencoder-specific tasks.  
      
    Args:  
        image_size: int. The size to which the images will be resized.  
    """  
    def __init__(self, image_size):  
        self.default_transform = transforms.Compose([  
            transforms.Resize((image_size, image_size)),  
            transforms.ToTensor(),  
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])  
        ])
  

        # Define a transformation that applies a random choice of color adjustments  for the auto encoder
        self.transform_ae = transforms.RandomChoice([  
            transforms.ColorJitter(brightness=0.2),  
            transforms.ColorJitter(contrast=0.2),  
            transforms.ColorJitter(saturation=0.2)  
        ])  
  
    def train_transform(self, image):
        """   
        Apply designated image transformations useful for training.  
          
        Args:  
            image: PIL.Image. Image to be transformed.  
  
        Returns:  
            Tuple containing the default transformed image and a variably transformed image for autoencoder tasks.  
        """
        return self.default_transform(image), self.default_transform(self.transform_ae(image))  
  
class ImageDataset(Dataset):  
    """   
    Apply designated image transformations useful for training.  
        
    Args:  
        image: PIL.Image. Image to be transformed.  

    Returns:  
        Tuple containing the default transformed image and a variably transformed image for autoencoder tasks.  
    """  
    def __init__(self, file_paths, transform=None):  
        self.file_paths = file_paths  
        self.transform = transform  
  
    def __len__(self):  
        return len(self.file_paths)  
  
    def __getitem__(self, index):  
        # Load image  
        img_path = self.file_paths[index]  
        image = Image.open(img_path).convert("RGB")  # Convert to RGB  
          
        # Apply transformations  
        if self.transform:  
            image = self.transform(image)  
          
        return image
