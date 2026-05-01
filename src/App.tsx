import React, { useState, useCallback, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import { RandomForestClassifier } from 'ml-random-forest';
import { Plus, Camera, Upload, Menu, ChevronDown, Sun, Moon, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import { ClassData, TrainingMetrics, ModelPredictions, ModelType } from './types';
import { DataService } from './data/dataService';
import { ModelTrainers } from './trainers/modelTrainers';
import { InferenceService } from './inference/inferenceService';
import { ClassCard } from './ui/ClassCard';
import { WebcamCapture } from './ui/WebcamCapture';

const CLASS_COLORS = [
  '#f59e0b', // Orange
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#10b981', // Emerald
];

export default function App() {
  const [classes, setClasses] = useState<ClassData[]>([
    { id: '1', name: 'healthy', images: [] },
    { id: '2', name: 'common rust', images: [] },
    { id: '3', name: 'northern leaf blight', images: [] },
  ]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [activeCaptureClass, setActiveCaptureClass] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };
  
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

      const cnnResult = await ModelTrainers.trainCNN(xs, ys, classes.length, (epoch) => {
        setTrainingProgress((epoch / 50) * 100);
      });
      modelsRef.current.cnn = cnnResult.model;
      setMetrics(prev => ({ ...prev, cnn: cnnResult.metrics }));

      await ModelTrainers.trainLogisticRegression(xs, ys, classes.length, () => {});
      await ModelTrainers.trainRandomForest(xs, ys, classes.length);

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
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col transition-colors duration-300">
      <header className="bg-card p-4 h-16 flex items-center gap-4 fixed top-0 w-full z-50 border-b border-border shadow-sm">
        <Button variant="ghost" size="icon" className="text-foreground">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-primary/10">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-primary">Teachable Machine</h1>
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-full">
            {isDarkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-slate-700" />}
          </Button>
        </div>
      </header>

      <main className="flex-1 mt-16 p-6 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Classes */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-6">
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
              className="w-full h-16 border-2 border-dashed border-border hover:border-primary/50 hover:bg-card text-muted-foreground transition-all flex items-center justify-center gap-4 group rounded-lg"
              onClick={addClass}
            >
              <div className="bg-secondary p-2 rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Plus className="h-5 w-5" />
              </div>
              <span className="font-bold uppercase tracking-widest text-xs">Add a class</span>
            </Button>
          </div>
        </div>

        {/* Middle Column: Training */}
        <div className="lg:col-span-3 flex flex-col items-center">
          <Card className="w-full bg-card border-2 border-border shadow-sm rounded-lg overflow-hidden sticky top-24">
            <div className="p-4 border-b border-border/30">
              <h2 className="text-lg font-bold text-foreground">Training</h2>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <Button 
                  size="lg" 
                  onClick={trainAll} 
                  disabled={isTraining}
                  className={`w-full h-12 font-bold transition-all border-none ${isTraining ? 'bg-secondary text-muted-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md'}`}
                >
                  {isTraining ? "Training..." : (isPredicting ? "Model Trained" : "Train Model")}
                </Button>

                {isTraining && (
                  <div className="space-y-2">
                    <Progress value={trainingProgress} className="h-2 bg-secondary" />
                    <p className="text-[10px] text-center font-bold uppercase tracking-widest text-muted-foreground">
                      Training {Math.round(trainingProgress)}%
                    </p>
                  </div>
                )}
              </div>

              <Separator className="bg-secondary" />

              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest group cursor-pointer hover:bg-secondary/50 p-2 rounded transition-colors">
                <span>Advanced</span>
                <ChevronDown className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="w-full bg-card border-2 border-border shadow-sm rounded-lg overflow-hidden sticky top-24">
            <div className="p-4 border-b border-border/30 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Preview</h2>
              <Button variant="outline" size="sm" className="h-8 text-primary font-bold text-[10px] uppercase tracking-widest px-4 border-primary/20">
                Export Model
              </Button>
            </div>
            
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-foreground">
                <span>Input</span>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={isPredicting} 
                    onCheckedChange={setIsPredicting} 
                    className="data-[state=checked]:bg-primary" 
                  />
                  <span>{isPredicting ? "ON" : "OFF"}</span>
                </div>
                <div className="ml-auto bg-secondary px-3 py-1 rounded flex items-center gap-2">
                  <span>Webcam</span>
                  <ChevronDown className="h-3 w-3" />
                </div>
              </div>

              <div className="aspect-video bg-black rounded-lg overflow-hidden relative border border-border/50">
                <WebcamCapture 
                  onCapture={runInference} 
                  isCapturing={isPredicting} 
                />
                {!isPredicting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 text-center">
                    <Brain className="h-12 w-12 mb-4 text-primary/20" />
                    <p className="font-bold text-xs text-muted-foreground uppercase tracking-[0.2em] px-8">
                      Train a model to see your results here
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center">
                    <ChevronDown className="h-3 w-3" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</h3>
                </div>

                <div className="space-y-4">
                  {classes.map((cls, idx) => {
                    const prob = predictions.cnn.find(p => p.className === cls.name)?.probability || 0;
                    return (
                      <div key={cls.id} className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-3">
                          <p className="text-[10px] font-bold uppercase tracking-tighter truncate leading-tight">
                            {cls.name}
                          </p>
                        </div>
                        <div className="col-span-9 flex items-center gap-3">
                          <div className="flex-1 h-5 bg-secondary rounded overflow-hidden relative border border-border/30">
                            <motion.div 
                              className="h-full"
                              style={{ backgroundColor: CLASS_COLORS[idx % CLASS_COLORS.length] }}
                              initial={{ width: 0 }}
                              animate={{ width: `${prob * 100}%` }}
                              transition={{ type: "spring", stiffness: 100, damping: 20 }}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white drop-shadow-sm">
                              {Math.round(prob * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {activeCaptureClass && (
        <div className="fixed bottom-4 right-4 w-48 aspect-video rounded-lg overflow-hidden border-2 border-primary shadow-2xl z-[100] pointer-events-none opacity-0">
          <WebcamCapture onCapture={handleCapture} isCapturing={true} />
        </div>
      )}
    </div>
  );
}
