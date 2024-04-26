# Some functions are copied and adjusted from this source https://github.com/nelson1425/EfficientAD/blob/main/efficientad.py
from efficientad_helper import *

class EfficientAD:
    # Class variables to store query state start/end and query autoencoder start/end (timestamps or indices)  
    q_st_start = None
    q_st_end = None
    q_ae_start = None
    q_ae_end = None
    
    def __init__(self, config):
        """Initializes the class with configuration settings.  
  
        Args:  
            config: dict containing configuration parameters.  
        """  

        self.cfg = config
        
        # Set seed for reproducibility across multiple runs  
        self.set_seed(self.cfg["seed"])
        
        # Setup dataset paths for training, validation, and testing  
        self.set_dataset_paths()
        
        # Initializes image transformations  
        self.transforms_class = ImageTransforms(self.cfg["image_size"])
        
        # Configure MLFlow tracking URI if provided  
        if self.cfg["mlflow_tracking_uri"]:
            mlflow.set_tracking_uri(uri=self.cfg["mlflow_tracking_uri"])
        
    def do_all(self):
        """Executes the full pipeline from data loading to model evaluation."""
        
        # Initialize datasets with corresponding transformations  
        self.train_dataset = ImageDataset(self.datasets_path["no_anomaly_train_paths"], transform=transforms.Lambda(self.transforms_class.train_transform))  
        self.validation_dataset = ImageDataset(self.datasets_path["no_anomaly_val_paths"], transform=transforms.Lambda(self.transforms_class.train_transform))

        # Prepare DataLoaders for training and validation  
        self.train_loader = DataLoader(self.train_dataset, batch_size=1, shuffle=True, num_workers=4, pin_memory=True)
        self.train_loader_infinite = InfiniteDataloader(self.train_loader)
        self.validation_loader = DataLoader(self.validation_dataset, batch_size=1)

        # Prepare models and perform training  
        self.prepare_teacher_student_autoencoder()
        self.teacher_normalization()
    
        self.train()
        self.save_models()
        self.save_normalization()
        self.evaluate_model()
        
    def create_model(self):
        """Creates and trains the model, logs with MLFlow if configured or runs everything locally otherwise."""
        
        self.prepare_output()
        
        # If MLFlow is configured, create an experiment, run it and log all necessary metrics and artifacts. 
        if self.cfg["mlflow_tracking_uri"]:
            mlflow.set_experiment(self.cfg["subdataset"])
            with mlflow.start_run():
                mlflow.set_tag("mlflow.runName", self.experiment_name)
                mlflow.log_params({
                    **self.cfg,
                }) 
        
                # Execute all train-validation-testing steps
                self.do_all()
                
                # Log performance metrics
                mlflow.log_metric("auc", self.final_auc)
                mlflow.log_metric("f1", self.final_f1)
                mlflow.log_metric("threshold", self.optimal_threshold)
                
                mlflow.log_metric("all pred", self.accuracy_threshold(self.scores['y_true_all'], self.scores['y_score_all']))
                mlflow.log_metric("test pred", self.accuracy_threshold(self.scores['y_true_test'], self.scores['y_score_test']))
                
                mlflow.log_metric("anomaly lvl 1 pred", self.accuracy_threshold(self.scores['y_true_a1'], self.scores['y_score_a1']))
                mlflow.log_metric("anomaly lvl 2 pred", self.accuracy_threshold(self.scores['y_true_a2'], self.scores['y_score_a2']))
                mlflow.log_metric("anomaly lvl 3 pred", self.accuracy_threshold(self.scores['y_true_a3'], self.scores['y_score_a3']))
                mlflow.log_metric("anomaly all pred", self.accuracy_threshold(self.scores['y_true_a'], self.scores['y_score_a']))
                
                mlflow.log_metric("no anomaly train pred", self.accuracy_threshold(self.scores['y_true_no_anomaly_train'], self.scores['y_score_no_anomaly_train']))
                mlflow.log_metric("no anomaly test pred",self.accuracy_threshold(self.scores['y_true_no_anomaly_test'],  self.scores['y_score_no_anomaly_test']))
                mlflow.log_metric("no anomaly all pred", self.accuracy_threshold(self.scores['y_true_no_anomaly_all'],  self.scores['y_score_no_anomaly_all']))
                
                # Log artifacts to reuse them for deployments
                mlflow.log_artifact(os.path.join(self.cfg["output_folder_path"], 'all_models.pth')  )
                mlflow.log_artifact(os.path.join(self.cfg["output_folder_path"], 'map_normalization.pth')  )
                mlflow.log_artifact(os.path.join(self.cfg["output_folder_path"], 'best_threshold.pkl')  )
        else:
            self.do_all()
            
    def set_seed(self, seed):  
        """Sets the seed for all random number generators for reproducibility.  
  
        Args:  
            seed: An integer representing the random seed.  
        """
        start_time = time.time()  
        print(f"- Setting seed to {seed}")
        
        # Set seed for numpy, torch, and random
        torch.manual_seed(seed)
        np.random.seed(seed)
        random.seed(seed)
        
        elapsed_time = (time.time() - start_time) * 1000
        print(f"- OK - Setting seed to {seed} ({elapsed_time:.2f} ms)\n")
        
    def prepare_output(self):
        """Prepares the output directory and experiment name based on configuration."""
        
        start_time = time.time()  
        print("- Setting config")
        
        # Configuring output path and experiment name based on whether weights are to be used 
        if 'weight_path' in self.cfg and self.cfg['weight_path']:
            experiment_name=f"{self.cfg['subdataset']}_steps_{self.cfg['train_steps']}_{self.cfg['model_type']}_weighted"
            output_path = f"{self.cfg['output_dir']}/{self.cfg['subdataset']}_steps_{self.cfg['train_steps']}_{self.cfg['model_type']}_weighted"  
        else:  
            experiment_name=f"{self.cfg['subdataset']}_steps_{self.cfg['train_steps']}_{self.cfg['model_type']}"
        
        self.experiment_name = experiment_name
        output_path = f"{self.cfg['output_dir']}/{experiment_name}"  

        # Create output directory if it doesn't exist, or clear if it does 
        if os.path.exists(output_path):  
            shutil.rmtree(output_path)
        
        self.cfg["output_folder_path"] = output_path
        print("     Output folder path:", output_path)
        os.makedirs(output_path)
        
        elapsed_time = (time.time() - start_time) * 1000
        print(f"- OK - Setting config ({elapsed_time:.2f} ms)\n")

    def set_dataset_paths(self):
        """Prepares and sets the dataset paths for the training, validation, and testing datasets."""
        
        start_time = time.time()  
        print("- Setting datasets path")
        
        # Get paths, and split into train, test, validation sets  
        no_anomaly_paths = glob.glob(f"{self.cfg['dataset_path']}/{self.cfg['subdataset']}/no_anomaly/*.jpg")  # adjust the pattern if needed

        train_paths, test_paths = train_test_split(no_anomaly_paths, test_size=0.2, random_state=self.cfg["seed"])
        train_paths, val_paths = train_test_split(train_paths, test_size=0.1, random_state=self.cfg["seed"])

        # Path setting for different levels of anomalies
        anomaly_lvl_1_paths = glob.glob(f"{self.cfg['dataset_path']}/{self.cfg['subdataset']}/anomaly_lvl_1/*.jpg")
        anomaly_lvl_2_paths = glob.glob(f"{self.cfg['dataset_path']}/{self.cfg['subdataset']}/anomaly_lvl_2/*.jpg")
        anomaly_lvl_3_paths = glob.glob(f"{self.cfg['dataset_path']}/{self.cfg['subdataset']}/anomaly_lvl_3/*.jpg")
        
        # Structuring all paths into a dictionary for easy access 
        datasets_path = {
            "no_anomaly_train_paths": train_paths,
            "no_anomaly_test_paths": test_paths,
            "no_anomaly_val_paths": val_paths,
            
            "anomaly_lvl_1_paths": anomaly_lvl_1_paths,
            "anomaly_lvl_2_paths": anomaly_lvl_2_paths,
            "anomaly_lvl_3_paths": anomaly_lvl_3_paths,
            "all_anomaly_paths": anomaly_lvl_1_paths + anomaly_lvl_2_paths + anomaly_lvl_3_paths,
            
            "test_paths": test_paths + anomaly_lvl_1_paths + anomaly_lvl_2_paths + anomaly_lvl_3_paths,
            "all": no_anomaly_paths + anomaly_lvl_1_paths + anomaly_lvl_2_paths + anomaly_lvl_3_paths
        }
        
        print("     Dataset paths:", datasets_path.keys())
        
        elapsed_time = (time.time() - start_time) * 1000
        print(f"- OK - Setting datasets path ({elapsed_time:.2f} ms)\n")
        self.datasets_path = datasets_path
        
        
        
    def prepare_teacher_student_autoencoder(self):
        """Initializes the teacher, student, and autoencoder models based on config settings."""
        start_time = time.time()  
        print("- Prepare teacher, student & autoencoder")
        
        # Initialize teacher and student models according to model type small or medium  
        if self.cfg["model_type"] == "small":
            teacher = get_pdn_small(self.cfg["out_channels"])
            student = get_pdn_small(2 * self.cfg["out_channels"])
        elif self.cfg["model_type"] == "medium":
            teacher = get_pdn_medium(self.cfg["out_channels"])
            student = get_pdn_medium(2 * self.cfg["out_channels"])
        
        # Load pretrained weights if path is specified
        if self.cfg["weight_path"]:
            print(f"     Loading weight {self.cfg['weight_path']}")
            state_dict = torch.load(self.cfg["weight_path"], map_location='cpu')
            teacher.load_state_dict(state_dict)
        else:
            print("     No weight to load")
        
        # Initialize autoencoder 
        autoencoder = get_autoencoder(self.cfg["out_channels"])
        
        # Setting models to appropriate train/eval mode
        # Since EfficientAD use the Student-Teacher approach, only the student and autoencder are in train mode
        teacher.eval()
        student.train()
        autoencoder.train()
        print("     Training")

        # Move models to GPU if specified in config  
        if self.cfg["on_gpu"]:
            teacher.cuda()
            student.cuda()
            autoencoder.cuda()
        
        self.teacher = teacher
        self.student = student
        self.autoencoder = autoencoder
        
        elapsed_time = (time.time() - start_time) * 1000
        print(f"- OK - Prepare teacher, student & autoencoder ({elapsed_time:.2f} ms)\n")
        
    def train(self):
        """  
        Train the autoencoder and student models with the teacher model outputs as guidance.  
          
        This function handles model training via backpropagation on training data, adjusts learning rates,  
        and records the training progress and time.  
        """  
        start_time = time.time()  
        print("- Train")
        
        # Prepare the optimizer for training with specified parameters 
        optimizer = torch.optim.Adam(
        itertools.chain(
            self.student.parameters(),
            self.autoencoder.parameters()
        ),
        lr=self.cfg["learning_rate"], weight_decay=self.cfg["weight_decay"])
        
        # Schedule learning rate updates 
        scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=int(0.95 * self.cfg["train_steps"]), gamma=0.1)
        
        # Progress bar for visual feedback  
        tqdm_obj = tqdm(range(self.cfg["train_steps"]))

        # Training loop
        for iteration, (image_st, image_ae) in zip(
                tqdm_obj, self.train_loader_infinite):
            
            # Move data to GPU if enabled 
            if self.cfg["on_gpu"]:
                image_st = image_st.cuda()
                image_ae = image_ae.cuda()
                
            # Teacher model inference followed by normalization 
            with torch.no_grad():
                teacher_output_st = self.teacher(image_st)
                teacher_output_st = (teacher_output_st - self.teacher_mean) / self.teacher_std
                
            # Calculate student model outputs and losses
            student_output_st = self.student(image_st)[:, :self.cfg["out_channels"]]
            distance_st = (teacher_output_st - student_output_st) ** 2
            d_hard = torch.quantile(distance_st, q=0.999)
            loss_hard = torch.mean(distance_st[distance_st >= d_hard])
            loss_st = loss_hard
            
            # Autoencoder model loss calculation  
            ae_output = self.autoencoder(image_ae)
            
            with torch.no_grad():
                teacher_output_ae = self.teacher(image_ae)
                teacher_output_ae = (teacher_output_ae - self.teacher_mean) / self.teacher_std
                
            student_output_ae = self.student(image_ae)[:, self.cfg["out_channels"]:]
            
            distance_ae = (teacher_output_ae - ae_output)**2
            distance_stae = (ae_output - student_output_ae)**2
            
            loss_ae = torch.mean(distance_ae)
            loss_stae = torch.mean(distance_stae)
            loss_total = loss_st + loss_ae + loss_stae
            
            # Perform model weight update
            optimizer.zero_grad()
            loss_total.backward()
            optimizer.step()
            scheduler.step()
            
            # Update progress description every 10 iterations 
            if iteration % 10 == 0:
                tqdm_obj.set_description(
                    "       Current loss: {:.4f}  ".format(loss_total.item()))
        
        # Switch models to evaluation mode after training
        self.teacher.eval()
        self.student.eval()
        self.autoencoder.eval()
        
        elapsed_time = (time.time() - start_time)
        print(f"- OK - Train ({elapsed_time:.2f} s)\n")


    def save_models(self):
        """  
        Save the trained models and their parameters.  
  
        Saves the autoencoder, student, and teacher models along with their means and standard deviations.  
        """  
        start_time = time.time()  
        save_path = os.path.join(self.cfg["output_folder_path"], 'all_models.pth')  
        print(f"- Saving models to {save_path}")
        
        # Define data to save  
        data_to_save = {  
            'teacher_mean': self.teacher_mean,  
            'teacher_std': self.teacher_std,  
            'teacher': self.teacher,  
            'student': self.student,  
            'autoencoder': self.autoencoder  
        }
        
        # Save data to the specified path  
        torch.save(data_to_save, save_path)
        
        elapsed_time = (time.time() - start_time) * 1000
        print(f"- OK - Saving models ({elapsed_time:.2f} ms)\n")
        
    def save_normalization(self):  
        """  
        Save normalization configuration used during training and predictions.  
  
        This involves saving defined quantiles for scaling the anomaly maps.  
        """  
        start_time = time.time()
        
        path_normalization=f'{self.cfg["output_folder_path"]}/map_normalization.pth'
        print(f"- Saving map normalization to {path_normalization}")
        
        self.map_normalization()
        
        # Save the mapping normalization parameters
        # Most useful part for the inference
        torch.save({  
            'q_st_start': self.q_st_start,  
            'q_st_end': self.q_st_end,  
            'q_ae_start': self.q_ae_start,  
            'q_ae_end': self.q_ae_end  
        }, path_normalization)  
                   
        elapsed_time = (time.time() - start_time) * 1000
        print(f"- OK - Saving map normalization ({elapsed_time:.2f} ms)\n")
        
    @torch.no_grad()
    def map_normalization(self):  
        """  
        Determine normalization parameters by evaluating the quantiles of the anomaly maps.  
  
        Updates class variables for quantile start and end points for Student and Autoencoder outputs.  
        """ 
        maps_st = []
        maps_ae = []
        
        # Gather maps for all validation images 
        for image, _ in tqdm(self.validation_loader, desc="     Map normalisation"):
            if self.cfg["on_gpu"]:
                image = image.cuda()
                
            map_combined, map_st, map_ae = self.predict(image)
            maps_st.append(map_st)
            maps_ae.append(map_ae)
            
            
        # Concatenate all maps and calculate quantiles 
        maps_st = torch.cat(maps_st)
        maps_ae = torch.cat(maps_ae)
        
        self.q_st_start = torch.quantile(maps_st, q=0.9)
        self.q_st_end = torch.quantile(maps_st, q=0.995)
        self.q_ae_start = torch.quantile(maps_ae, q=0.9)
        self.q_ae_end = torch.quantile(maps_ae, q=0.995)
        
    @torch.no_grad()
    def teacher_normalization(self):
        start_time = time.time()  
        print(f"- Normalizing teacher")
        
        mean_outputs = []
        for train_image, _ in tqdm(self.train_loader, desc='    Computing mean of features'):
            if self.cfg["on_gpu"]:
                train_image = train_image.cuda()
            teacher_output = self.teacher(train_image)
            mean_output = torch.mean(teacher_output, dim=[0, 2, 3])
            mean_outputs.append(mean_output)
        channel_mean = torch.mean(torch.stack(mean_outputs), dim=0)
        channel_mean = channel_mean[None, :, None, None]

        mean_distances = []
        for train_image, _ in tqdm(self.train_loader, desc='    Computing std of features'):
            if self.cfg["on_gpu"]:
                train_image = train_image.cuda()
            teacher_output = self.teacher(train_image)
            distance = (teacher_output - channel_mean) ** 2
            mean_distance = torch.mean(distance, dim=[0, 2, 3])
            mean_distances.append(mean_distance)
        channel_var = torch.mean(torch.stack(mean_distances), dim=0)
        channel_var = channel_var[None, :, None, None]
        channel_std = torch.sqrt(channel_var)

        elapsed_time = (time.time() - start_time)
        print(f"- OK - Normalizing teacher ({elapsed_time:.2f} s)\n")
        
        self.teacher_mean = channel_mean
        self.teacher_std = channel_std
        
    def get_scores(self, dataset_path, desc):
        y_true = []
        y_score = []
        
        for path in tqdm(dataset_path, desc=desc):
            
            image = Image.open(path)
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
                mode='bilinear'
            )
            
            map_combined = map_combined[0, 0].cpu().numpy()

            defect_class = os.path.basename(os.path.dirname(path))

            y_true_image = 0 if defect_class == 'no_anomaly' else 1
            y_score_image = np.max(map_combined)
            
            y_true.append(y_true_image)
            y_score.append(y_score_image)
            
        return y_true, y_score

    @torch.no_grad()
    def predict(self, image):  
        """  
        Perform prediction using teacher, student, and autoencoder models, and combine their outputs.  
  
        Args:  
            image: torch.Tensor. Input image tensor for anomaly detection.  
  
        Returns:  
            tuple: Contains combined map, map from teacher-student, and map from autoencoder-student.  
        """
        # Perform predictions
        teacher_output = self.teacher(image)
        teacher_output = (teacher_output - self.teacher_mean) / self.teacher_std
        student_output = self.student(image)
        autoencoder_output = self.autoencoder(image)
        
        # Calculate anomaly maps  
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
        
        # Normalize maps if quantile values are set 
        if self.q_st_start is not None:
            map_st = 0.1 * (map_st - self.q_st_start) / (self.q_st_end - self.q_st_start)
        
        if self.q_ae_start is not None:
            map_ae = 0.1 * (map_ae - self.q_ae_start) / (self.q_ae_end - self.q_ae_start)
            
        # Combine maps 
        map_combined = 0.5 * map_st + 0.5 * map_ae
        return map_combined, map_st, map_ae

        
    def define_best_threshold(self, y_true, y_score):  
        """  
        Identifies the best threshold by the ROC curve and evaluates model by AUC, F1 score and confusion matrix.  
  
        Args:  
            y_true: list. True binary labels.  
            y_score: list. Target scores, can either be probability estimates of the positive class.  
        """  
        # AUC calculation 
        self.final_auc = roc_auc_score(y_true=y_true, y_score=y_score)  
        print(f"\n     - AUC: {self.final_auc * 100:.2f}%")  
        
        fpr, tpr, thresholds = roc_curve(y_true, y_score)  
        optimal_idx = np.argmax(tpr - fpr)  
        optimal_threshold = thresholds[optimal_idx]  
        print(f"    - Optimal Threshold: {optimal_threshold:.7f}")  
        
        y_pred = (y_score >= optimal_threshold).astype(int)  
        conf_matrix = confusion_matrix(y_true, y_pred)  
        
        # Calculate F1 score and set the optimal threshold  
        self.final_f1 = f1_score(y_true, y_pred)
        self.optimal_threshold = optimal_threshold
        print(f"    - F1 Score: {self.final_f1:.2f}")
        print("    - CONFUSION MATRIX:\n", conf_matrix, "\n")  
        
        # ROC curve plotting
        plt.figure(figsize=(8, 6))  
        plt.plot(fpr, tpr, label=f"ROC Curve (AUC = {self.final_auc:.2f})")  
        plt.scatter(fpr[optimal_idx], tpr[optimal_idx], marker='o', color='red', label=f'Optimal threshold = {self.optimal_threshold:.7f}')  
        plt.plot([0, 1], [0, 1], 'k--')  # dashed diagonal line  
        plt.xlabel("False Positive Rate")  
        plt.ylabel("True Positive Rate")  
        plt.title("ROC Curve")  
        plt.legend(loc="best")  
        plt.grid(True)  
        plt.show()
        
        # Save the optimal threshold for later use 
        path_threshold=f'{self.cfg["output_folder_path"]}/best_threshold.pkl'
        with open(path_threshold, 'wb') as f:  
            pickle.dump(self.optimal_threshold, f)
                   
    def accuracy_threshold(self, y_true, y_score): 
        """  
        Calculates accuracy based on a predefined threshold.  
  
        Args:  
            y_true: list or numpy.array. True binary labels.  
            y_score: list or numpy.array. Target scores.  
  
        Returns:  
            float: Accuracy percentage.  
        """   
        y_pred = (np.array(y_score) >= self.optimal_threshold).astype(int)  
        correct_predictions = (y_pred == y_true).sum()  
        accuracy = (correct_predictions / len(y_true)) * 100  
        return accuracy
    
    def evaluate_model(self):
        """   
        Evaluate model performance across datasets, identify threshold and collect scores.   
          
        Updates internal state by setting 'self.scores' with evaluation details for different datasets.  
          
        Also measures and prints the time taken to perform the evaluations.  
        """  
        start_time = time.time()
        print(f"- Evaluating model")
        
        # Get scores for combined datasets  
        y_true_all, y_score_all = self.get_scores(self.datasets_path["all"], "     inference all")
        self.define_best_threshold(y_true_all, y_score_all)
        
        # Get scores for datasets with different anomaly levels  
        y_true_a1, y_score_a1 = self.get_scores(self.datasets_path["anomaly_lvl_1_paths"], "    inference anomaly lvl 1")
        y_true_a2, y_score_a2 = self.get_scores(self.datasets_path["anomaly_lvl_2_paths"], "    inference anomaly lvl 2")
        y_true_a3, y_score_a3 = self.get_scores(self.datasets_path["anomaly_lvl_3_paths"], "    inference anomaly lvl 3")
        y_true_a, y_score_a = self.get_scores(self.datasets_path["all_anomaly_paths"], "    inference all anomaly")
        print("")
        
        # Get scores for no anomaly across training, validation, and test sets  
        y_true_no_anomaly_train, y_score_no_anomaly_train = self.get_scores(self.datasets_path["no_anomaly_train_paths"] + self.datasets_path["no_anomaly_val_paths"], "    inference no anomaly train")
        y_true_no_anomaly_test, y_score_no_anomaly_test = self.get_scores(self.datasets_path["no_anomaly_test_paths"] , "    inference no anomaly test")
        y_true_no_anomaly_all, y_score_no_anomaly_all = self.get_scores(self.datasets_path["no_anomaly_train_paths"] + self.datasets_path["no_anomaly_val_paths"] + self.datasets_path["no_anomaly_test_paths"], "    inference all no anomaly")
        print("")
        
        # Get scores for only the test dataset 
        y_true_test, y_score_test = self.get_scores(self.datasets_path["test_paths"], "    Test dataset")
        
        # Collect all test scores in a dictionary
        self.scores = {
            "y_true_test": y_true_test,  
            "y_score_test": y_score_test,
            
            "y_true_a1": y_true_a1,  
            "y_score_a1": y_score_a1,
            
            "y_true_a2": y_true_a2,  
            "y_score_a2": y_score_a2,  
            
            "y_true_a3": y_true_a3,  
            "y_score_a3": y_score_a3,  
            
            "y_true_a": y_true_a,  
            "y_score_a": y_score_a,  
            
            "y_true_no_anomaly_train": y_true_no_anomaly_train,  
            "y_score_no_anomaly_train": y_score_no_anomaly_train,
              
            "y_true_no_anomaly_test": y_true_no_anomaly_test,  
            "y_score_no_anomaly_test": y_score_no_anomaly_test, 
             
            "y_true_no_anomaly_all": y_true_no_anomaly_all,  
            "y_score_no_anomaly_all": y_score_no_anomaly_all,  
            
            "y_true_all": y_true_all,  
            "y_score_all": y_score_all,
        }
        # self.display_eval_result()
        elapsed_time = (time.time() - start_time)
        print(f"- OK - Evaluating model ({elapsed_time:.2f} s)\n")
        
    def display_eval_result(self):   
        """   
        Display evaluation results formatted into a table with dataset names and their corresponding accuracies.  
        """   
        # Define the column widths  
        width_label = 20  
        width_value = 10  
        
        # Header  
        print(f"{'Dataset':{width_label}}{'Accuracy':>{width_value}}")  
        print("-" * (width_label + width_value))  
        
        # Data rows  
        print(f"{'Anonaly lvl 1':{width_label}}{self.accuracy_threshold(self.scores['y_true_a1'], self.scores['y_score_a1']):>{width_value}.2f}")  
        print(f"{'Anonaly lvl 2':{width_label}}{self.accuracy_threshold(self.scores['y_true_a2'], self.scores['y_score_a2']):>{width_value}.2f}")  
        print(f"{'Anonaly lvl 3':{width_label}}{self.accuracy_threshold(self.scores['y_true_a3'], self.scores['y_score_a3']):>{width_value}.2f}")  
        print(f"\n{'Anomaly all':{width_label}}{self.accuracy_threshold(self.scores['y_true_a'], self.scores['y_score_a']):>{width_value}.2f}")  
    
        print("")  
        print(f"{'No Anomaly Train':{width_label}}{self.accuracy_threshold(self.scores['y_true_no_anomaly_train'], self.scores['y_score_no_anomaly_train']):>{width_value}.2f}")  
        print(f"{'No Anomaly Test':{width_label}}{self.accuracy_threshold(self.scores['y_true_no_anomaly_test'],  self.scores['y_score_no_anomaly_test']):>{width_value}.2f}")  
        print(f"{'No Anomaly All':{width_label}}{self.accuracy_threshold(self.scores['y_true_no_anomaly_all'],  self.scores['y_score_no_anomaly_all']):>{width_value}.2f}")  
    
        print("")  
        print(f"{'All without train':{width_label}}{self.accuracy_threshold(self.scores['y_true_test'], self.scores['y_score_test']):>{width_value}.2f}")  
        print(f"{'All with train':{width_label}}{self.accuracy_threshold(self.scores['y_true_all'], self.scores['y_score_all']):>{width_value}.2f}")  
    