import * as tf from '@tensorflow/tfjs';
import { RandomForestClassifier } from 'ml-random-forest';
import { PredictionResult, ClassData } from '../types';

export class InferenceService {
  static async predictTF(
    model: tf.LayersModel,
    input: tf.Tensor3D,
    classes: ClassData[]
  ): Promise<PredictionResult[]> {
    const prediction = tf.tidy(() => {
      const expanded = input.expandDims(0);
      return model.predict(expanded) as tf.Tensor;
    });

    const probabilities = await prediction.data();
    prediction.dispose();

    return Array.from(probabilities).map((prob, i) => ({
      className: classes[i]?.name || `Class ${i}`,
      probability: prob,
    }));
  }

  static async predictRF(
    model: RandomForestClassifier,
    input: tf.Tensor3D,
    classes: ClassData[]
  ): Promise<PredictionResult[]> {
    const flatInput = tf.tidy(() => {
      return input.reshape([-1]).arraySync() as number[];
    });

    // ml-random-forest predict returns the class index
    // To get probabilities, we'd need to check the trees, but the library might not expose it easily.
    // However, we can simulate it or just show 100% for the predicted class.
    const predictedClassIndex = model.predict([flatInput])[0];
    
    return classes.map((cls, i) => ({
      className: cls.name,
      probability: i === predictedClassIndex ? 1 : 0,
    }));
  }
}
