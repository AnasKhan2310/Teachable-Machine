import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import { RandomForestClassifier } from 'ml-random-forest';
import { Plus, Play, Brain, BarChart3, Camera, Upload, Settings2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

import { ClassData, TrainingMetrics, ModelPredictions, ModelType } from './types';
import { DataService } from './data/dataService';
import { ModelTrainers } from './trainers/modelTrainers';
import { InferenceService } from './inference/inferenceService';
import { ClassCard } from './ui/ClassCard';
import { WebcamCapture } from './ui/WebcamCapture';

export default function App() {
  const [classes, setClasses] = useState<ClassData[]>([
    { id: '1', name: 'Class 1', images: [] },
    { id: '2', name: 'Class 2', images: [] },
  ]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [currentModelType, setCurrentModelType] = useState<ModelType>('cnn');
  const [activeCaptureClass, setActiveCaptureClass] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  
  // Models
  const modelsRef = useRef<{
    logisticRegression: tf.LayersModel | null;
    cnn: tf.LayersModel | null;
    randomForest: RandomForestClassifier | null;
  }>({
    logisticRegression: null,
    cnn: null,
    randomForest: null,
  });

  const [metrics, setMetrics] = useState<Record<ModelType, TrainingMetrics | null>>({
    logisticRegression: null,
    randomForest: null,
    cnn: null,
  });

  const [predictions, setPredictions] = useState<ModelPredictions>({
    logisticRegression: [],
    randomForest: [],
    cnn: [],
  });

  const addClass = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    const classNumber = classes.length + 1;
    setClasses([...classes, { id: newId, name: `Class ${classNumber}`, images: [] }]);
  };

  const updateClass = (id: string, updates: Partial<ClassData>) => {
    setClasses(classes.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteClass = (id: string) => {
    if (classes.length <= 2) return;
    setClasses(classes.filter(c => c.id !== id));
  };

  const handleCapture = useCallback((imageSrc: string) => {
    if (activeCaptureClass) {
      setClasses(prev => prev.map(c => 
        c.id === activeCaptureClass 
          ? { ...c, images: [...c.images, imageSrc] } 
          : c
      ));
    }
  }, [activeCaptureClass]);

  const trainAll = async () => {
    if (classes.some(c => c.images.length < 5)) {
      alert("Each class needs at least 5 images to train.");
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);

    try {
      const { xs, ys } = await DataService.prepareDataset(classes);

      // Logistic Regression
      setTrainingProgress(10);
      const lrResult = await ModelTrainers.trainLogisticRegression(xs, ys, classes.length, (epoch) => {
        setTrainingProgress(10 + (epoch / 20) * 20);
      });
      modelsRef.current.logisticRegression = lrResult.model;
      setMetrics(prev => ({ ...prev, logisticRegression: lrResult.metrics }));

      // Random Forest
      setTrainingProgress(40);
      const rfResult = await ModelTrainers.trainRandomForest(xs, ys, classes.length);
      modelsRef.current.randomForest = rfResult.model;
      setMetrics(prev => ({ ...prev, randomForest: rfResult.metrics }));
      setTrainingProgress(60);

      // CNN
      const cnnResult = await ModelTrainers.trainCNN(xs, ys, classes.length, (epoch) => {
        setTrainingProgress(60 + (epoch / 50) * 40);
      });
      modelsRef.current.cnn = cnnResult.model;
      setMetrics(prev => ({ ...prev, cnn: cnnResult.metrics }));

      setTrainingProgress(100);
      setIsPredicting(true);
      
      xs.dispose();
      ys.dispose();
    } catch (error) {
      console.error("Training failed:", error);
    } finally {
      setIsTraining(false);
    }
  };

  const runInference = useCallback(async (imageSrc: string) => {
    const tensor = await DataService.processImage(imageSrc);
    
    const results: ModelPredictions = {
      logisticRegression: [],
      randomForest: [],
      cnn: [],
    };

    if (modelsRef.current.logisticRegression) {
      results.logisticRegression = await InferenceService.predictTF(
        modelsRef.current.logisticRegression,
        tensor,
        classes
      );
    }

    if (modelsRef.current.randomForest) {
      results.randomForest = await InferenceService.predictRF(
        modelsRef.current.randomForest,
        tensor,
        classes
      );
    }

    if (modelsRef.current.cnn) {
      results.cnn = await InferenceService.predictTF(
        modelsRef.current.cnn,
        tensor,
        classes
      );
    }

    setPredictions(results);
    tensor.dispose();
  }, [classes]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border p-4 flex items-center justify-between bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-1.5 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Teachable Machine Pro</h1>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="border-success/50 text-success bg-success/5 px-3 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-success mr-2 animate-pulse" />
            System Ready
          </Badge>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Classes */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Classes
            </h2>
          </div>
          
          <div className="space-y-4">
            {classes.map((cls) => (
              <ClassCard
                key={cls.id}
                classData={cls}
                onUpdate={updateClass}
                onDelete={deleteClass}
                onStartCapture={(id) => setActiveCaptureClass(id)}
                onStopCapture={() => setActiveCaptureClass(null)}
                isCapturing={activeCaptureClass === cls.id}
              />
            ))}
            
            <Button 
              variant="outline" 
              className="w-full h-20 border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
              onClick={addClass}
            >
              <Plus className="h-6 w-6 mr-2 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Add a class</span>
            </Button>
          </div>
        </div>

        {/* Middle Column: Training */}
        <div className="lg:col-span-3 flex flex-col">
          <div className="sticky top-24 space-y-6">
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Play className="h-5 w-5 text-primary fill-current" />
                  Training
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Button 
                    size="lg" 
                    onClick={trainAll} 
                    disabled={isTraining}
                    className="w-full h-14 font-bold text-lg shadow-lg shadow-primary/20"
                  >
                    {isTraining ? (
                      <RefreshCcw className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-5 w-5 fill-current" />
                    )}
                    {isTraining ? "Training..." : "Train Model"}
                  </Button>

                  {isTraining && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                        <span>Progress</span>
                        <span>{Math.round(trainingProgress)}%</span>
                      </div>
                      <Progress value={trainingProgress} className="h-2" />
                    </div>
                  )}
                </div>

                <Separator className="bg-border/50" />

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Model Accuracy</h3>
                  <div className="space-y-2">
                    {(['cnn', 'randomForest'] as const).map(type => (
                      <div key={type} className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border/50">
                        <span className="text-[10px] font-bold uppercase">{type}</span>
                        <span className="text-xs font-mono font-bold text-primary">
                          {metrics[type] ? (metrics[type]!.accuracy * 100).toFixed(1) : "0.0"}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4 text-primary" />
              <AlertTitle className="text-xs font-bold uppercase tracking-wider">Tip</AlertTitle>
              <AlertDescription className="text-[10px] text-muted-foreground">
                Capture at least 20 images per class for better accuracy.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-4 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Preview
          </h2>
          
          <Card className="border-border bg-card overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-video bg-black relative">
                <WebcamCapture 
                  onCapture={runInference} 
                  isCapturing={isPredicting} 
                />
                {!isPredicting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm p-6 text-center z-20">
                    <Brain className="h-12 w-12 mb-4 opacity-20 text-primary" />
                    <p className="font-bold text-sm text-muted-foreground uppercase tracking-widest">
                      Train a model to see preview
                    </p>
                  </div>
                )}
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Predictions (CNN)</h3>
                  <div className="space-y-3">
                    {predictions.cnn.length > 0 ? (
                      predictions.cnn.map((p, i) => (
                        <div key={i} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span>{p.className}</span>
                            <span className="text-primary">{(p.probability * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-primary"
                              initial={{ width: 0 }}
                              animate={{ width: `${p.probability * 100}%` }}
                              transition={{ type: "spring", stiffness: 100 }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-24 flex items-center justify-center border-2 border-dashed border-border rounded-lg text-xs text-muted-foreground uppercase tracking-widest">
                        No Prediction
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border p-4 text-center text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
        © 2026 Teachable Machine Pro • Optimized for Local Deployment
      </footer>

      {/* Hidden capture for active class */}
      {activeCaptureClass && (
        <div className="fixed bottom-4 right-4 w-48 aspect-video rounded-lg overflow-hidden border-2 border-primary shadow-2xl z-[100] pointer-events-none opacity-0">
          <WebcamCapture onCapture={handleCapture} isCapturing={true} />
        </div>
      )}
    </div>
  );
}

function RefreshCcw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

function CartGrid(props: any) {
  return <CartesianGrid {...props} />;
}
