import * as tf from '@tensorflow/tfjs';
import { RandomForestClassifier } from 'ml-random-forest';
import { TrainingMetrics, IMAGE_SIZE, CHANNELS } from '../types';

export class ModelTrainers {
  static async trainLogisticRegression(
    xs: tf.Tensor4D,
    ys: tf.Tensor,
    numClasses: number,
    onProgress: (epoch: number, logs: any) => void
  ): Promise<{ model: tf.LayersModel; metrics: TrainingMetrics }> {
    const model = tf.sequential();
    model.add(tf.layers.flatten({ inputShape: [IMAGE_SIZE, IMAGE_SIZE, CHANNELS] }));
    model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    const history: any[] = [];
    const res = await model.fit(xs, ys, {
      epochs: 20,
      batchSize: 8,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          history.push({ epoch, loss: logs?.loss, acc: logs?.acc });
          onProgress(epoch, logs);
        },
      },
    });

    return {
      model,
      metrics: {
        accuracy: res.history.acc[res.history.acc.length - 1] as number,
        history,
        confusionMatrix: [], // Will calculate later if needed
      },
    };
  }

  static async trainCNN(
    xs: tf.Tensor4D,
    ys: tf.Tensor,
    numClasses: number,
    onProgress: (epoch: number, logs: any) => void
  ): Promise<{ model: tf.LayersModel; metrics: TrainingMetrics }> {
    const model = tf.sequential();
    
    // Layer 1
    model.add(tf.layers.conv2d({
      inputShape: [IMAGE_SIZE, IMAGE_SIZE, CHANNELS],
      kernelSize: 3,
      filters: 16,
      activation: 'relu',
      padding: 'same'
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    
    // Layer 2
    model.add(tf.layers.conv2d({ kernelSize: 3, filters: 32, activation: 'relu', padding: 'same' }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    
    // Layer 3
    model.add(tf.layers.conv2d({ kernelSize: 3, filters: 64, activation: 'relu', padding: 'same' }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    
    model.add(tf.layers.flatten());
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));

    model.compile({
      optimizer: tf.train.adam(0.0005), // Slightly lower learning rate for stability
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    const epochs = 100;
    const history: any[] = [];
    const res = await model.fit(xs, ys, {
      epochs,
      batchSize: 16,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          history.push({ epoch, loss: logs?.loss, acc: logs?.acc });
          onProgress(epoch, logs);
        },
      },
    });

    return {
      model,
      metrics: {
        accuracy: res.history.acc[res.history.acc.length - 1] as number,
        history,
        confusionMatrix: [],
      },
    };
  }

  static async trainRandomForest(
    xs: tf.Tensor4D,
    ys: tf.Tensor,
    numClasses: number
  ): Promise<{ model: RandomForestClassifier; metrics: TrainingMetrics }> {
    // Random Forest needs flattened data
    const flatXs = xs.reshape([xs.shape[0], -1]).arraySync() as number[][];
    const labels = ys.argMax(-1).arraySync() as number[];

    const options = {
      seed: 42,
      maxFeatures: 0.8,
      replacement: true,
      nEstimators: 20,
    };

    const rf = new RandomForestClassifier(options);
    rf.train(flatXs, labels);

    // Estimate accuracy on training data (simple for demo)
    const predictions = rf.predict(flatXs);
    let correct = 0;
    predictions.forEach((p, i) => {
      if (p === labels[i]) correct++;
    });

    return {
      model: rf,
      metrics: {
        accuracy: correct / labels.length,
        history: [],
        confusionMatrix: [],
      },
    };
  }
}
