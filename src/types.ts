import { Tensor3D } from '@tensorflow/tfjs';

export interface ClassData {
  id: string;
  name: string;
  images: string[]; // base64 strings
}

export interface TrainingMetrics {
  accuracy: number;
  confusionMatrix: number[][];
  history: { epoch: number; loss: number; acc: number }[];
}

export interface PredictionResult {
  className: string;
  probability: number;
}

export interface ModelPredictions {
  logisticRegression: PredictionResult[];
  randomForest: PredictionResult[];
  cnn: PredictionResult[];
}

export type ModelType = 'logisticRegression' | 'randomForest' | 'cnn';

export const IMAGE_SIZE = 64; // Small size for 4GB RAM
export const CHANNELS = 3;
