import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Image as ImageIcon, Camera, MoreVertical, Pencil } from 'lucide-react';
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
  const [isEditingName, setIsEditingName] = useState(false);

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
    <Card className="w-full bg-card border-border border-2 shadow-sm rounded-lg overflow-hidden group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b border-border/30">
        <div className="flex items-center gap-2 group/title">
          <Input
            value={classData.name}
            onChange={(e) => onUpdate(classData.id, { name: e.target.value })}
            className="font-bold text-lg border-none bg-transparent focus-visible:ring-0 p-0 text-foreground h-auto w-auto min-w-[100px]"
          />
          <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/title:opacity-100 transition-opacity cursor-pointer" />
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {classData.images.length} Image Samples
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(classData.id)} 
            className="h-6 text-[10px] text-muted-foreground hover:text-destructive uppercase tracking-widest font-bold"
          >
            Delete Class
          </Button>
        </div>
        
        <div className="flex gap-4">
          <div className="flex flex-col gap-2 shrink-0">
            <Button
              variant={isCapturing ? "destructive" : "secondary"}
              className="h-14 w-28 flex flex-col items-center justify-center gap-1 bg-secondary hover:bg-secondary/80 text-primary border-none shadow-sm"
              onClick={() => isCapturing ? onStopCapture() : onStartCapture(classData.id)}
            >
              <Camera className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{isCapturing ? "Stop" : "Webcam"}</span>
            </Button>
            
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={handleFileUpload}
              />
              <Button 
                variant="secondary" 
                className="h-14 w-28 flex flex-col items-center justify-center gap-1 bg-secondary hover:bg-secondary/80 text-primary border-none shadow-sm"
              >
                <ImageIcon className="h-5 w-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
              </Button>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <ScrollArea className="w-full whitespace-nowrap rounded-md border border-border/50 bg-secondary/30 h-28">
              <div className="flex p-2 gap-2">
                {classData.images.length === 0 ? (
                  <div className="w-24 h-24 flex items-center justify-center text-[10px] text-muted-foreground uppercase tracking-widest bg-muted/20 rounded">
                    No Samples
                  </div>
                ) : (
                  classData.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`sample-${i}`}
                      className="h-24 w-24 rounded object-cover shadow-sm border border-border/50"
                      referrerPolicy="no-referrer"
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>

      <div className="h-1 bg-primary/20 w-full">
        <div 
          className="h-full bg-primary transition-all duration-300" 
          style={{ width: `${Math.min(100, (classData.images.length / 50) * 100)}%` }} 
        />
      </div>
    </Card>
  );
};
