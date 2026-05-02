# Teachable Machine (AI Image Classifier)

Teachable Machine is a powerful, browser-based machine learning application that allows users to train custom image classification models in real-time. Inspired by Google's Teachable Machine, it provides a simple 3-column workflow to collect data, train models, and test predictions instantly.

## 🚀 Features

- **Real-time Training**: Train Convolutional Neural Networks (CNN) directly in your browser using TensorFlow.js.
- **3-Column Workflow**:
  - **Data Collection**: Create multiple classes and add samples via Webcam or Bulk File Upload.
  - **Training Control**: Monitor training progress and accuracy metrics.
  - **Live Preview**: Test your model with a live webcam feed and see real-time probability bars.
- **Advanced ML Architecture**:
  - **CNN with Batch Normalization**: Improved stability and feature extraction.
  - **Data Augmentation**: Automatically doubles your dataset with horizontal flips for better generalization.
  - **Multi-Model Support**: Includes CNN, Random Forest, and Logistic Regression for comparison.
- **Privacy First**: All processing happens locally on your device. No images are uploaded to any server.
- **Optimized Performance**: Designed to run efficiently on devices with limited resources (e.g., 4GB RAM).

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4.
- **Machine Learning**: TensorFlow.js, ML-Random-Forest.
- **UI Components**: Shadcn/UI, Lucide React, Framer Motion.
- **Build Tool**: Vite.

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/ai-image-classifier-pro.git
   cd ai-image-classifier-pro
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## 📖 How to Use

1. **Define Classes**: Add classes (e.g., "Person", "Bottle", "Empty") using the left panel.
2. **Collect Samples**:
   - Use the **Webcam** button to capture live samples.
   - Use the **Upload** button to select multiple images from your computer.
3. **Train**: Click the **Train Model** button in the middle column. Watch the progress bar as the CNN learns.
4. **Predict**: Once training is complete, the right panel will show live predictions from your webcam.

## 💡 Tips for Better Accuracy

- **Quantity**: Aim for at least 30-50 images per class.
- **Variety**: Capture images from different angles, distances, and lighting conditions.
- **Backgrounds**: Try to have a neutral or varied background so the model focuses on the object, not the room.

