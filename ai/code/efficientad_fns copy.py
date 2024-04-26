# Some functions are copied and adjusted from this source https://github.com/nelson1425/EfficientAD/blob/main/efficientad.py
from efficientad_helper import *

class EfficientAD:
    @torch.no_grad()
    def predict(self, image):
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

        
    def define_best_threshold(self, y_true, y_score):
        # Metrics calculation  
        self.final_auc = roc_auc_score(y_true=y_true, y_score=y_score)  
        print(f"\n     - AUC: {self.final_auc * 100:.2f}%")  
        
        fpr, tpr, thresholds = roc_curve(y_true, y_score)  
        optimal_idx = np.argmax(tpr - fpr)  
        optimal_threshold = thresholds[optimal_idx]  
        print(f"    - Optimal Threshold: {optimal_threshold:.7f}")  
        
        y_pred = (y_score >= optimal_threshold).astype(int)  
        conf_matrix = confusion_matrix(y_true, y_pred)  
        
        self.final_f1 = f1_score(y_true, y_pred)
        self.optimal_threshold = optimal_threshold
        print(f"    - F1 Score: {self.final_f1:.2f}")
        print("    - CONFUSION MATRIX:\n", conf_matrix, "\n")  
        
        # Plotting  
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
        
        path_threshold=f'{self.cfg["output_folder_path"]}/best_threshold.pkl'
    
        with open(path_threshold, 'wb') as f:  
            pickle.dump(self.optimal_threshold, f)
                   
    def accuracy_threshold(self, y_true, y_score):  
        y_pred = (np.array(y_score) >= self.optimal_threshold).astype(int)  
        correct_predictions = (y_pred == y_true).sum()  
        accuracy = (correct_predictions / len(y_true)) * 100  
        return accuracy
    
    def evaluate_model(self):
        start_time = time.time()
        print(f"- Evaluating model")
        
        y_true_all, y_score_all = self.get_scores(self.datasets_path["all"], "     inference all")
        self.define_best_threshold(y_true_all, y_score_all)
        
        y_true_a1, y_score_a1 = self.get_scores(self.datasets_path["anomaly_lvl_1_paths"], "    inference anomaly lvl 1")
        y_true_a2, y_score_a2 = self.get_scores(self.datasets_path["anomaly_lvl_2_paths"], "    inference anomaly lvl 2")
        y_true_a3, y_score_a3 = self.get_scores(self.datasets_path["anomaly_lvl_3_paths"], "    inference anomaly lvl 3")
        y_true_a, y_score_a = self.get_scores(self.datasets_path["all_anomaly_paths"], "    inference all anomaly")
        print("")
        y_true_no_anomaly_train, y_score_no_anomaly_train = self.get_scores(self.datasets_path["no_anomaly_train_paths"] + self.datasets_path["no_anomaly_val_paths"], "    inference no anomaly train")
        y_true_no_anomaly_test, y_score_no_anomaly_test = self.get_scores(self.datasets_path["no_anomaly_test_paths"] , "    inference no anomaly test")
        y_true_no_anomaly_all, y_score_no_anomaly_all = self.get_scores(self.datasets_path["no_anomaly_train_paths"] + self.datasets_path["no_anomaly_val_paths"] + self.datasets_path["no_anomaly_test_paths"], "    inference all no anomaly")
        print("")
        y_true_test, y_score_test = self.get_scores(self.datasets_path["test_paths"], "    Test dataset")
        
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
    