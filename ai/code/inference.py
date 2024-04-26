import argparse
import time, os
import numpy as np
import torch, cv2
from tqdm import tqdm
from glob import glob
from PIL import Image
from torchvision import transforms
from sklearn.metrics import roc_auc_score
import glob

import matplotlib.pyplot as plt  
import torch  
from torchvision.utils import make_grid  

def load_model(
    config
):  
    """Load the models required for anomaly detection including teacher, student and autoencoder models along with their configuration mean and std tensors.  
  
    Args:  
        config: dict. Configuration dictionary containing paths and object details.  
  
    Returns:  
        tuple: Loaded teacher model, student model, autoencoder model, their mean tensor and std tensor.  
    """  
    teacher_net = torch.load(f"{config['checkpoint_path']}/{config['object']}/teacher_final.pth", map_location=config["device"])
    student_net = torch.load(f"{config['checkpoint_path']}/{config['object']}/student_final.pth", map_location=config["device"])
    ae_net = torch.load(f"{config['checkpoint_path']}/{config['object']}/autoencoder_final.pth", map_location=config["device"])
    teacher_mean_tensor = torch.load(f"{config['checkpoint_path']}/{config['object']}/teacher_mean.pth", map_location=config["device"])
    teacher_std_tensor = torch.load(f"{config['checkpoint_path']}/{config['object']}/teacher_std.pth", map_location=config["device"])

    teacher_net.eval(), student_net.eval(), ae_net.eval()
    return teacher_net, student_net, ae_net, teacher_mean_tensor, teacher_std_tensor

@torch.no_grad()
def inference(pil_img, teacher_model, student_model, ae_model, 
                teacher_mean, teacher_std, out_channels=384,
                default_transform=None,
                q_st_start=None, q_st_end=None, 
                q_ae_start=None, q_ae_end=None, 
                device='cuda:0'):  
    """Perform inference to generate anomaly maps using teacher and student network discrepancies.  
  
    Args:  
        pil_img: PIL.Image. Input image for inference.  
        teacher_model: torch.Module. Pre-trained teacher model.  
        student_model: torch.Module. Pre-trained student model.  
        ae_model: torch.Module. Pre-trained autoencoder model.  
        teacher_mean: torch.Tensor. Mean value for normalization.  
        teacher_std: torch.Tensor. Std dev value for normalization.  
        out_channels: int. Number of channels in output from student model.  
        default_transform: torchvision.transforms. Transformations to be applied to the input image.  
        q_st_start, q_st_end, q_ae_start, q_ae_end: float. Quantile start and end values for normalization.  
        device: str. Device to perform calculations ('cuda:0' or 'cpu').  
  
    Returns:  
        tuple: Map of combined anomalies, student model anomalies, autoencoder anomalies, autoencoder output.  
    """  
    
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

    # Transform for sending to model
    pil_tensor         = default_transform(pil_img)
    pil_tensor         = pil_tensor[None]
    pil_tensor         = pil_tensor.to(device)

    teacher_output     = teacher_model(pil_tensor)
    # print("OK", teacher_output)
    # teacher_output     = (teacher_output - teacher_mean) / teacher_std
    student_output     = student_model(pil_tensor) # [1, 384, 56, 56]
    autoencoder_output = ae_model(pil_tensor)      # [1, 384, 56, 56]

    map_st = torch.mean((teacher_output - student_output[:, :out_channels]) ** 2, dim=1, keepdim=True)  
    map_ae = torch.mean((autoencoder_output - student_output[:, out_channels:]) ** 2, dim=1, keepdim=True)  
  
    if q_st_start is not None:
        map_st = 0.1 * (map_st - q_st_start) / (q_st_end - q_st_start)
    if q_ae_start is not None:
        map_ae = 0.1 * (map_ae - q_ae_start) / (q_ae_end - q_ae_start)
        
    map_combined = 0.5 * map_st + 0.5 * map_ae
    
    return map_combined, map_st, map_ae, autoencoder_output


# Configuration Sample for the inference  
# config = {
#     "object": "cookies",
#     "phase": "test",
#     "fold": "defective",
#     "output_path": "../output/steps_70000_cookies_2/visualization",
#     "inference_mode": "pth",
#     "checkpoint_path": "../output/steps_70000_cookies_2/trainings",
#     "data_path": "../notebooks/my_dataset",
#     "device": "cpu",
# }

def inferenc_api(config, image_path):
    """
    API Endpoint for running inference on a single image with anomaly detection models.  
  
    Args:  
        config: dict. Configuration dictionary as described above.  
        image_path: str. Path to the input image file.  
  
    Returns:  
        tuple: Processing time and combined anomaly map for the input image.  
    """  
    # Define data path
    obj = config["object"]
    phase = config["phase"]
    fold = config["fold"]
    inference_mode = config["inference_mode"]
    checkpoint_path = config["checkpoint_path"]
    data_dir = f"{config['data_path']}/{obj}/{phase}/{fold}"
    output_dir = f"{config['output_path']}/{obj}/{phase}/{fold}"
    os.makedirs(output_dir, exist_ok=True)
    
    
    # Define input size and tensor transform
    image_size = 256
    default_transform = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                            std=[0.229, 0.224, 0.225])
    ])

    # Load trained models  
    teacher_net, student_net, ae_net, teacher_mean_tensor, teacher_std_tensor = load_model(config)

    time_cost_list = []
    with torch.no_grad():
        s1 = time.time()
        img_path = image_path

        # Load the image and apply inference  
        pil_img = Image.open(img_path)
        orig_width = pil_img.width
        orig_height = pil_img.height

        map_combined, map_st, map_ae, autoencoder_output = inference(pil_img, 
                                                teacher_net, student_net, ae_net, 
                                                teacher_mean_tensor, teacher_std_tensor,
                                                default_transform=default_transform,
                                                q_st_start=None, q_st_end=None, 
                                                q_ae_start=None, q_ae_end=None)
        
        # Resize the combined map to the original image size  
        map_combined = torch.nn.functional.pad(map_combined, (4, 4, 4, 4))
        map_combined = torch.nn.functional.interpolate(map_combined, (orig_height, orig_width), mode='bilinear')
        map_combined = map_combined[0, 0].cpu().numpy()
        
        s2 = time.time()
        processing_time = (s2 - s1) * 1000 # Calculate processing time in milliseconds  

    return processing_time, map_combined
    
    
  
def visualize_output(tensor, channel_indices=[0, 1, 2]):  
    """
    Visualize three channel output from the provided tensor.  
  
    Args:  
        tensor: torch.Tensor. The tensor to visualize, typically an output feature tensor from a network.  
        channel_indices: list of int. Indices of the channels to visualize.  
  
    Returns:  
        PIL.Image: Visual representation of selected channels in the input tensor.  
    """    
    if tensor.dim() == 4 and tensor.shape[1] >= 3:  
        tensor = tensor[:, channel_indices, :, :]  # Select three channels  
    tensor = tensor.clamp(0, 1).to('cpu').detach()  
    tensor = transforms.functional.to_pil_image(tensor.squeeze(0))  
    return tensor  



def calculate_score(files_path, class_name):  
    """
    Calculate diagnostic scores and timing for a list of file paths using preconfigured anomaly detection models.  
  
    Args:  
        files_path: list of str. Paths to the image files to analyze.  
        class_name: str. Label of the class, 'good' or otherwise considered negative class.  
  
    Returns:  
        tuple: List of times, ground truth labels, and diagnostic scores for the files.  
    """  
    times = []
    y_true = []
    y_score = []
    
    for filepath in files_path:
        map_combined, time = inferenc_api(config, filepath)
        times.append(time)
        
        y_true.append(0 if class_name == 'good' else 1)
        
        # Store min, mean and max values
        y_score.append(np.max(map_combined).item())
    
    # Print timing and score information  
    print("TIME")
    print("Min time:", np.min(times))
    print("Mean time:", np.mean(times))
    print("Max time:", np.max(times))

    print("\nScore")
    print("Min score:", np.min(y_score))
    print("Mean score:", np.mean(y_score))
    print("Max score:", np.max(y_score))
    
    return times, y_true, y_score