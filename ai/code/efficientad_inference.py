from efficientad_helper import *

import psutil  

# Not very reliable to be honest, a nice way to have a glance of it.
# Having a browser, a second screen can affect this already, it is best to perform this remotely, havne't tried yet.
def process_memory():  
    """ Calculate the memory usage of the current process in KB. """  

    process = psutil.Process(os.getpid())  
    return process.memory_info().rss / 1024  # Return memory usage in KB  

class EfficientADInference:
    """   
    Class to handle the setup and operations for the anomaly detection inference
    """  
    
    # Initializing quantization variables to None.  
    q_st_start = None
    q_st_end = None
    q_ae_start = None
    q_ae_end = None
    
    def __init__(self, config, models, map_normalization, threshold):
        """    
        Initialize class with configurations, models, normalization mappings, and threshold.  
            
        Args:    
            config (dict): Configurations for the setup.  
            models (dict): Dictionary containing model components.  
            map_normalization (dict): Normalization mappings for quantization.  
            threshold (float): Threshold value for classifying anomalies.  
        """  
        self.cfg = config
        
        self.set_seed(self.cfg["seed"])
        self.transforms_class = ImageTransforms(self.cfg["image_size"])
        
        # Assigning model components. 
        self.teacher = models["teacher"]
        self.teacher_mean = models["teacher_mean"]
        self.teacher_std = models["teacher_std"]
        self.student = models["student"]
        self.autoencoder = models["autoencoder"]
        
        # Setting up the quantization variables.  
        self.q_st_start = map_normalization["q_st_start"]
        self.q_st_end = map_normalization["q_st_end"]
        self.q_ae_start = map_normalization["q_ae_start"]
        self.q_ae_end = map_normalization["q_ae_end"]
        
        self.threshold = threshold
        
    def set_seed(self, seed):  
        """    
        Set the seed for all necessary libraries to ensure reproducibility.  
            
        Args:    
            seed (int): The seed value.  
        """  

        start_time = time.time()  
        print(f"- Setting seed to {seed}")
        
        torch.manual_seed(seed)
        np.random.seed(seed)
        random.seed(seed)
        
        elapsed_time = (time.time() - start_time) * 1000
        print(f"- OK - Setting seed to {seed} ({elapsed_time:.2f} ms)\n")
        
    def get_exif_orientation(self, image):  
        """    
        Retrieves the EXIF orientation tag from the image, if available.
          
        Args:  
            image (Image): Image object to extract the EXIF orientation.  
          
        Returns:  
            int: EXIF orientation value, defaults to 1 if not available.  
        """  
        try:  
            orientation = ""
            exif = image._getexif()  
            orientation = exif.get(0x112, 1)  
        except AttributeError:  
            # _getexif is not available for all image types or the image does not have EXIF data  
            pass  
        return orientation 


    def apply_exif_orientation(self, image, orientation):  
        """    
        Adjusts image according to its EXIF orientation.  
            
        Args:  
            image (Image): Image to adjust.  
            orientation (int): EXIF orientation code.  
            
        Returns:  
            Image: Modified image after applying EXIF orientation.  
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

    def inference_by_image_path(self, path, display=None):  
        """  
        Loads an image, performs inference, and either displays results or saves them based on 'display' flag.  
          
        Args:  
            path (str): Path to the image file.  
            display (bool, optional): If True, displays image and heatmap, otherwise saves results to disk.  
              
        Returns:  
            tuple: Anomaly score, classification result, and memory used during inference.  
        """  
        image = Image.open(path)
        orientation = self.get_exif_orientation(image)
        
        result = self.inference(image)  
        result['heatmap']
        if display:
            plt.figure(figsize=(12, 6))  

            plt.subplot(1, 3, 1)  
            plt.imshow(image)  
            plt.title('Original Image')  
            plt.axis('off')  

            heatmap_threshold=self.threshold
            heatmap_thresholded = np.where(result['heatmap'] > heatmap_threshold, result['heatmap'], 0)    
            
            plt.subplot(1, 3, 2)
            plt.imshow(heatmap_thresholded, cmap='jet', interpolation='nearest')  
            plt.title('Anomaly Heatmap')  
            plt.axis('off')  

            plt.subplot(1, 3, 3)  
            plt.imshow(image)  
            plt.imshow(heatmap_thresholded, cmap='jet', interpolation='nearest', alpha=0.5)  
            plt.title('Anomaly Heatmap Overlay')  
            plt.axis('off')  
            plt.show()  
        else:
            
            heatmap_threshold=self.threshold
            heatmap_thresholded = np.where(result['heatmap'] > heatmap_threshold, result['heatmap'], 0)
             
            plt.figure(figsize=(5.12, 5.12), dpi=100)  # adjusted figsize and dpi for 256x256 image  
            plt.imshow(image)  
            plt.imshow(heatmap_thresholded, cmap='jet', interpolation='nearest', alpha=0.5)  
            plt.axis('off')
            save_path = path.replace('.jpg', '_result.jpg')  

            plt.savefig(save_path, dpi=100, bbox_inches='tight', pad_inches=0)
            plt.close('all')  
            
            # Had an issue where the picture returned where not on the same orientation, turns out the dataset I've created
            # from my phone was full of images with exif metadata including the orientation. Having trained the model already,
            # I've decided to apply this orientation, at the end it's a cool add-on, never though this was going to be an issue.
            if orientation:
                image = Image.open(save_path)
                image = self.apply_exif_orientation(image, orientation)
                image.save(save_path)
        
        classification = "anomaly" if result['classification'] == 1 else "no_anomaly"
        return result['score'], classification, result["used_memory"]
        
    def inference(self, image): 
        """    
        Process an image to detect anomalies, normalizing and resizing as necessary.  
          
        Args:  
            image (Image): The image to process.  
          
        Returns:  
            dict: Contains anomaly score, classification, heatmap, and used memory details.  
        """  
        start_mem = process_memory()
        orig_width, orig_height = image.size
        image = self.transforms_class.default_transform(image)  
        image = image[None]  
          
        if self.cfg["on_gpu"]:  
            image = image.cuda()  
              
        map_combined, map_st, map_ae = self.predict(image)  
        
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
        
        classification = 1 if y_score_image > self.threshold else 0 
        used_memory = process_memory() - start_mem # Memory used in MB
         
        return {'score': y_score_image, 'classification': classification, 'heatmap': map_combined, "used_memory": used_memory} 

    @torch.no_grad()  
    def predict(self, image):   
        """ Computes the output maps for the teacher, student, and autoencoder models.  
          
        Args:  
            image (Tensor): Image tensor input.  
          
        Returns:  
            tuple: Combined output map, student output map, and autoencoder map.  
        """  
        teacher_output = self.teacher(image)  
        teacher_output = (teacher_output - self.teacher_mean) / self.teacher_std  
        student_output = self.student(image)  
        autoencoder_output = self.autoencoder(image)  
          
        map_st = torch.mean(  
            (teacher_output - student_output[:, :self.cfg["out_channels"]])**2,  
            dim=1,  
            keepdim=True  
        )  
          
        map_ae = torch.mean(  
            (autoencoder_output - student_output[:, self.cfg["out_channels"]:])**2,  
            dim=1,   
            keepdim=True  
        )  
          
        if self.q_st_start is not None:  
            map_st = 0.1 * (map_st - self.q_st_start) / (self.q_st_end - self.q_st_start)  
          
        if self.q_ae_start is not None:  
            map_ae = 0.1 * (map_ae - self.q_ae_start) / (self.q_ae_end - self.q_ae_start)  
              
        map_combined = 0.5 * map_st + 0.5 * map_ae  
        return map_combined, map_st, map_ae