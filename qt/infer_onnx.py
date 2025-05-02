import onnxruntime as ort
import numpy as np
import cv2
import sys
import os
import torch
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from alphabets import plate_chr
from lib.utils.utils import strLabelConverter
from PIL import Image

class LicensePlateRecognizer:
    def __init__(self, model_path='saved_model/best.onnx'):
        # Initialize ONNX Runtime session
        self.session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name

        # Initialize CTC decoder
        self.converter = strLabelConverter(plate_chr)

        # Image preprocessing parameters (from training config)
        self.img_size = (48, 168)  # height, width
        self.mean = 0.588
        self.std = 0.193

    def preprocess_image(self, image_path):
        # Load and preprocess image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Failed to load image: {image_path}")
        
        # Convert BGR to RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Resize to model input size
        img = cv2.resize(img, (self.img_size[1], self.img_size[0]))
        
        # Normalize (same as training)
        img = img.astype(np.float32) / 255.0
        img = (img - self.mean) / self.std
        
        # Convert to CHW format and add batch dimension
        img = img.transpose(2, 0, 1)  # HWC to CHW
        img = np.expand_dims(img, axis=0)  # Add batch dimension
        return img

    def decodePlate(self, preds):
        """Decode plate number using the method from onnx_infer.py"""
        pre = 0
        newPreds = []
        for i in range(len(preds)):
            if preds[i] != 0 and preds[i] != pre:
                newPreds.append(preds[i])
            pre = preds[i]
        
        plate = ""
        for i in newPreds:
            plate += plate_chr[int(i)]
        return plate

    def infer(self, image_path):
        # Preprocess image
        input_data = self.preprocess_image(image_path)
        print("input_data.shape:", input_data.shape)
        
        # Run inference
        outputs = self.session.run([self.output_name], {self.input_name: input_data})
        output = outputs[0]  # Shape: [batch, time_steps, num_classes]
        
        # Decode CTC output using the method from onnx_infer.py
        preds = np.argmax(output, axis=2)[0]  # Get max probability indices for the first batch
        plate_no = self.decodePlate(preds)
        
        return plate_no

if __name__ == "__main__":
    recognizer = LicensePlateRecognizer()
    image_path = "path/to/test_image.jpg"  # Replace with your test image
    result = recognizer.infer(image_path)
    print(f"Recognized License Plate: {result}")