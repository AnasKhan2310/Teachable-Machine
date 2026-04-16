import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Image as ImageIcon, Camera } from 'lucide-react';
import { ClassData } from '../types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ClassCardProps {
  classData: ClassData;
  onUpdate: (id: string, updates: Partial<ClassData>) => void;
  onDelete: (id: string) => void;
  onStartCapture: (id: string) => void;
  onStopCapture: () => void;
  isCapturing: boolean;
}

export const ClassCard: React.FC<ClassCardProps> = ({
  classData,
  onUpdate,
  onDelete,
  onStartCapture,
  onStopCapture,
  isCapturing,
}) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const filePromises = Array.from(files).map((file: File) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises).then((base64Images) => {
      onUpdate(classData.id, { images: [...classData.images, ...base64Images] });
    });
  };

  return (
    <Card className="w-full bg-card border-border overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b border-border/50">
        <div className="flex items-center gap-2 flex-1">
          <Input
            value={classData.name}
            onChange={(e) => onUpdate(classData.id, { name: e.target.value })}
            className="font-semibold border-none bg-transparent focus-visible:ring-0 p-0 text-base h-auto"
          />
        </div>
        <Button variant="ghost" size="icon" onClick={() => onDelete(classData.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Add Image Samples:</p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={isCapturing ? "destructive" : "secondary"}
              className="h-24 flex flex-col gap-2 border-2 border-dashed border-border hover:border-primary/50 transition-colors"
              onClick={() => isCapturing ? onStopCapture() : onStartCapture(classData.id)}
            >
              <Camera className="h-8 w-8" />
              <span className="text-xs font-bold uppercase tracking-wider">{isCapturing ? "Stop" : "Webcam"}</span>
            </Button>
            <div className="relative">
              <Input
                type="file"
                multiple
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={handleFileUpload}
              />
              <Button variant="secondary" className="w-full h-24 flex flex-col gap-2 border-2 border-dashed border-border hover:border-primary/50 transition-colors">
                <ImageIcon className="h-8 w-8" />
                <span className="text-xs font-bold uppercase tracking-wider">Upload</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex -space-x-2 overflow-hidden">
              {classData.images.slice(-5).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`sample-${i}`}
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-card object-cover"
                  referrerPolicy="no-referrer"
                />
              ))}
              {classData.images.length > 5 && (
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted ring-2 ring-card text-[10px] font-bold">
                  +{classData.images.length - 5}
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {classData.images.length} Samples
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
