import sys
from PyQt5.QtWidgets import QApplication, QMainWindow, QWidget, QVBoxLayout, QPushButton, QLabel, QFileDialog
from PyQt5.QtGui import QPixmap
from PyQt5.QtCore import Qt
from PIL import Image
import os
from infer_onnx import LicensePlateRecognizer

class LicensePlateUI(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("License Plate Recognition")
        self.setGeometry(100, 100, 800, 600)

        # Initialize recognizer
        self.recognizer = LicensePlateRecognizer('../saved_model/best.onnx')

        # Create main widget and layout
        self.main_widget = QWidget()
        self.setCentralWidget(self.main_widget)
        self.layout = QVBoxLayout(self.main_widget)

        # Image display
        self.image_label = QLabel("No image loaded")
        self.image_label.setAlignment(Qt.AlignCenter)
        self.image_label.setMinimumHeight(200)
        self.layout.addWidget(self.image_label)

        # Load image button
        self.load_button = QPushButton("Load Image")
        self.load_button.clicked.connect(self.load_image)
        self.layout.addWidget(self.load_button)

        # Result display
        self.result_label = QLabel("Recognized Plate: None")
        self.layout.addWidget(self.result_label)

        # Stretch to push content to top
        self.layout.addStretch()

        # Current image path
        self.image_path = None

    def load_image(self):
        # Open file dialog to select image
        file_dialog = QFileDialog(self)
        file_dialog.setNameFilter("Images (*.png *.jpg *.jpeg)")
        if file_dialog.exec_():
            self.image_path = file_dialog.selectedFiles()[0]
            
            # Display image
            pixmap = QPixmap(self.image_path)
            pixmap = pixmap.scaled(600, 200, Qt.KeepAspectRatio)
            self.image_label.setPixmap(pixmap)
            
            # Run inference
            try:
                result = self.recognizer.infer(self.image_path)
                self.result_label.setText(f"Recognized Plate: {result}")
            except Exception as e:
                self.result_label.setText(f"Error: {str(e)}")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = LicensePlateUI()
    window.show()
    sys.exit(app.exec_())