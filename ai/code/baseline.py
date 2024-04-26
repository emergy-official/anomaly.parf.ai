# Importing necessary libraries for data management  
import glob  
import os  
import numpy as np  
import pandas as pd  
from sklearn.model_selection import train_test_split  
from sklearn.metrics import classification_report  

# Importing TensorFlow and Keras libraries for building and training the neural network  
import tensorflow as tf  
from tensorflow.keras.preprocessing.image import ImageDataGenerator  
from tensorflow.keras.applications import MobileNet  
from tensorflow.keras.models import Model, Sequential  
from tensorflow.keras.layers import (Input, Conv2D, MaxPooling2D, Flatten,   
                                     Dropout, Dense, GlobalAveragePooling2D)  
from tensorflow.keras.optimizers import Adam  

def create_datagen():  
    """  
    Creates an image data generator object with rescaling.  
      
    Returns:  
        ImageDataGenerator with rescaling to scale image pixel values to [0, 1].  
    """
    return ImageDataGenerator(rescale=1./255)  
  
def create_gen(datagen, df, batch_size=32):
    """  
    Creates a generator for feeding data into the neural network from a dataframe.  
      
    Args:  
        datagen: The ImageDataGenerator instance to use for data augmentation.  
        df: Pandas DataFrame containing the file paths and classes.  
        batch_size: Number of images to process at once (default: 32).  
      
    Returns:  
        An iterator that returns batches of images and their classes.  
    """  
    return datagen.flow_from_dataframe(  
        dataframe=df,  
        x_col='filename',  
        y_col='class',  
        target_size=(160, 160),  
        class_mode='categorical',  
        batch_size=batch_size,  
        shuffle=True  
    )  
    
def build_model():      
    """  
    Builds a deep learning model using a pre-trained MobileNet as the base.  
      
    Returns:  
        A compiled TensorFlow model ready for training.  
    """  
    # Load MobileNet as the base model with pretrained weights from ImageNet, without the top layer 
    base_model = MobileNet(input_shape=(160, 160, 3),  
                           include_top=False,  
                           weights='imagenet',  
                           pooling='avg')  
  
     # Set the base model's layers to be non-trainable
    base_model.trainable = False
    
    # Define the new model's architecture  
    model = Sequential([  
        base_model,  
        Dense(128, activation='relu'),  # Add a fully connected layer with 128 units and ReLU activation 
        Dense(2, activation='softmax') # Add an output layer with 2 units using softmax for multi-class classification (Future baseline improvment where you need to classify different anomaly)
    ])  
  
    # Compile the model with Adam optimizer, low learning rate, categorical cross-entropy loss, and with accuracy metric  
    model.compile(optimizer=tf.keras.optimizers.legacy.Adam(learning_rate=1e-5), loss='categorical_crossentropy', metrics=['accuracy'])  
    return model  
  

def create_model_and_save(cfg):
    """  
    Creates a model and save it 
      
    Args:  
        cfg: The config defined the in the notebook 
      
    Returns:  
        The model created
    """  
    # Use glob to find paths for no anomalies and three levels of anomalies within a dataset.  
    no_anomaly_paths = glob.glob(f"{cfg['dataset_path']}/{cfg['subdataset']}/no_anomaly/*.jpg")  # adjust the pattern if needed

    anomaly_lvl_1_paths = glob.glob(f"{cfg['dataset_path']}/{cfg['subdataset']}/anomaly_lvl_1/*.jpg")
    anomaly_lvl_2_paths = glob.glob(f"{cfg['dataset_path']}/{cfg['subdataset']}/anomaly_lvl_2/*.jpg")
    anomaly_lvl_3_paths = glob.glob(f"{cfg['dataset_path']}/{cfg['subdataset']}/anomaly_lvl_3/*.jpg")

    # Combine all anomaly paths into a single list.  
    all_anomaly_paths = anomaly_lvl_1_paths + anomaly_lvl_2_paths + anomaly_lvl_3_paths

    # Assign labels to the images.  
    no_anomaly_labels = ["no_anomaly"] * len(no_anomaly_paths)
    anomaly_labels = ["anomaly"] * len(all_anomaly_paths)

    # Labels split by anomaly level
    anomaly_1_labels = ["anomaly"] * len(anomaly_lvl_1_paths)
    anomaly_2_labels = ["anomaly"] * len(anomaly_lvl_2_paths)
    anomaly_3_labels = ["anomaly"] * len(anomaly_lvl_3_paths)

    # Combine paths and labels into singular lists for partitioning.  
    all_paths = no_anomaly_paths + all_anomaly_paths  
    all_labels = no_anomaly_labels + anomaly_labels  

    # Split data into train, validation, and test sets using sklearn's train_test_split.  
    train_paths, test_paths, train_labels, test_labels = train_test_split(all_paths, all_labels, test_size=0.2, random_state=cfg["seed"])  
    train_paths, val_paths, train_labels, val_labels = train_test_split(train_paths, train_labels, test_size=0.1, random_state=cfg["seed"])  
    
    # Convert lists into pandas DataFrames for the data generators.  
    train_df = pd.DataFrame({'filename': train_paths, 'class': train_labels})  
    val_df = pd.DataFrame({'filename': val_paths, 'class': val_labels})  
    test_df = pd.DataFrame({'filename': test_paths, 'class': test_labels})

    # Additional DataFrames potentially for specific evaluations, not used in training.  
    all_df = pd.DataFrame({'filename': all_paths, 'class': all_labels})  
    all_anomaly_df = pd.DataFrame({'filename': all_anomaly_paths, 'class': anomaly_labels})
    anomaly_1_df = pd.DataFrame({'filename': anomaly_lvl_1_paths, 'class': anomaly_1_labels})  
    anomaly_2_df = pd.DataFrame({'filename': anomaly_lvl_2_paths, 'class': anomaly_2_labels})  
    anomaly_3_df = pd.DataFrame({'filename': anomaly_lvl_3_paths, 'class': anomaly_3_labels})
  
    # Initialize image data generators with augmentation parameters for training.  
    train_datagen = ImageDataGenerator(  
        rescale=1./255,  
        rotation_range=40,
        horizontal_flip=True,  
        fill_mode='nearest'  
    )


    # Data generators for validation, testing, and specific anomaly levels.
    val_datagen = create_datagen()  
    test_datagen = create_datagen()  
    all_datagen = create_datagen()
    all_anomaly_datagen = create_datagen()
    anomaly_1_datagen = create_datagen()  
    anomaly_2_datagen = create_datagen()
    anomaly_3_datagen = create_datagen()

    # Data generators utilizing the above ImageDataGenerator configurations. 
    train_gen = create_gen(train_datagen, train_df)  
    val_gen = create_gen(val_datagen, val_df)  
    
    # Batch size is 1 for testing individual predictions 
    test_gen = create_gen(test_datagen, test_df, batch_size=1) 
    all_gen = create_gen(all_datagen, all_df, batch_size=1) 
    all_anomaly_gen = create_gen(all_anomaly_datagen, all_anomaly_df, batch_size=1) 
    anomaly_1_gen = create_gen(anomaly_1_datagen, anomaly_1_df, batch_size=1)   
    anomaly_2_gen = create_gen(anomaly_2_datagen, anomaly_2_df, batch_size=1) 
    anomaly_3_gen = create_gen(anomaly_3_datagen, anomaly_3_df, batch_size=1) 
  
    # Build and train a model.
    model = build_model()
    history = model.fit(  
        train_gen,  
        epochs=50,  
        validation_data=val_gen  
    )   

    
    # Evaluate the model on test and specific datasets, print accuracy.  
    test_loss, test_acc = model.evaluate(test_gen)
    print(f"Test accuracy: {test_acc * 100:.2f}%")
    test_loss, test_acc = model.evaluate(all_gen)
    print(f"(ALL) Test accuracy: {test_acc * 100:.2f}%")
    
    # Continuing evaluation for specific anomaly levels.  
    test_loss, test_acc = model.evaluate(all_anomaly_gen)
    print(f"(all_anomaly_gen) Test accuracy: {test_acc * 100:.2f}%")
    
    test_loss, test_acc = model.evaluate(anomaly_1_gen)
    print(f"(anomaly_1_gen) Test accuracy: {test_acc * 100:.2f}%")
    
    test_loss, test_acc = model.evaluate(anomaly_2_gen)
    print(f"(anomaly_2_gen) Test accuracy: {test_acc * 100:.2f}%")
    
    test_loss, test_acc = model.evaluate(anomaly_3_gen)
    print(f"(anomaly_3_gen) Test accuracy: {test_acc * 100:.2f}%")
    
    # Obtain predictions for the classification report.  
    test_gen.reset()
    predictions = model.predict(test_gen, steps=len(test_gen))  
    predicted_classes = np.argmax(predictions, axis=1)
    true_classes = test_gen.classes  
    class_labels = list(test_gen.class_indices.keys())

    # Generate a classification report  
    report = classification_report(true_classes, predicted_classes, target_names=class_labels)  
    print(report)
    
    # Save the model in a directory based on configuration settings.  
    output_path = f"{cfg['output_path']}/baseline/{cfg['subdataset']}"
    os.makedirs(output_path, exist_ok=True)
    
    model.save(f"{output_path}/local.keras")
    
    return model