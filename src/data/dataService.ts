import * as tf from '@tensorflow/tfjs';
import { IMAGE_SIZE } from '../types';

export class DataService {
  static async processImage(imageSrc: string): Promise<tf.Tensor3D> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const tensor = tf.tidy(() => {
          const raw = tf.browser.fromPixels(img);
          const resized = tf.image.resizeBilinear(raw, [IMAGE_SIZE, IMAGE_SIZE]);
          const normalized = resized.div(255.0);
          return normalized as tf.Tensor3D;
        });
        resolve(tensor);
      };
      img.onerror = (err) => reject(err);
      img.src = imageSrc;
    });
  }

  static async imagesToTensors(images: string[]): Promise<tf.Tensor4D> {
    const tensors = await Promise.all(images.map(img => this.processImage(img)));
    const stacked = tf.stack(tensors) as tf.Tensor4D;
    tensors.forEach(t => t.dispose());
    return stacked;
  }

  static async prepareDataset(classes: { id: string; images: string[] }[]) {
    const allImages: string[] = [];
    const allLabels: number[] = [];

    classes.forEach((cls, index) => {
      cls.images.forEach(img => {
        allImages.push(img);
        allLabels.push(index);
      });
    });

    const baseTensors = await Promise.all(allImages.map(img => this.processImage(img)));
    
    // Data Augmentation: Add horizontal flips to double the dataset
    const augmentedTensors = tf.tidy(() => {
      const stacked = tf.stack(baseTensors) as tf.Tensor4D;
      const flipped = tf.image.flipLeftRight(stacked);
      return tf.concat([stacked, flipped], 0);
    });

    // Double the labels to match augmented tensors
    const augmentedLabels = [...allLabels, ...allLabels];
    const ys = tf.oneHot(tf.tensor1d(augmentedLabels, 'int32'), classes.length);

    baseTensors.forEach(t => t.dispose());

    return { xs: augmentedTensors, ys };
  }
}
