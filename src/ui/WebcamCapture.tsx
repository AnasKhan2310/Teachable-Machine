import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCcw } from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (imageSrc: string) => void;
  isCapturing: boolean;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture, isCapturing }) => {
  const webcamRef = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
    }
  }, [webcamRef, onCapture]);

  // Auto-capture if isCapturing is true
  React.useEffect(() => {
    let interval: any;
    if (isCapturing) {
      interval = setInterval(capture, 100);
    }
    return () => clearInterval(interval);
  }, [isCapturing, capture]);

  return (
    <div className="relative w-full h-full bg-black">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode }}
        className="w-full h-full object-cover"
        mirrored={facingMode === 'user'}
        disablePictureInPicture={true}
        forceScreenshotSourceSize={false}
        imageSmoothing={true}
        onUserMedia={() => {}}
        onUserMediaError={() => {}}
        screenshotQuality={0.92}
      />
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-30">
        <Button 
          size="icon" 
          variant="secondary" 
          className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60"
          onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
        >
          <RefreshCcw className="h-4 w-4 text-white" />
        </Button>
        <Button 
          size="icon" 
          className="h-12 w-12 rounded-full bg-primary shadow-lg shadow-primary/40 border-4 border-white/20 hover:scale-105 transition-transform"
          onClick={capture}
        >
          <Camera className="h-5 w-5 text-white" />
        </Button>
        <div className="w-10" /> {/* Spacer for symmetry */}
      </div>
    </div>
  );
};
