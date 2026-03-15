"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, FileUp, Loader2, Pill, Sparkles, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { extractMedicationsFromImage, ExtractMedicationsOutput } from "@/ai/flows/extract-medications-flow";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMedicine } from "@/context/medicine-context";
import { type Medicine } from "@/lib/data";

type Status = "idle" | "capturing" | "analyzing" | "success" | "error";

export default function AddPrescriptionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { refreshMedicines } = useMedicine();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ExtractMedicationsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'capturing') {
        const getCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setHasCameraPermission(true);
            if (videoRef.current) {
            videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            setStatus('idle');
            toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
            });
        }
        };
        getCameraPermission();
    } else {
        // Stop camera stream when not capturing
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }
  }, [status, toast]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUri = canvas.toDataURL('image/jpeg');
      setImageDataUri(dataUri);
      setStatus('idle');
      handleAnalyze(dataUri);
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
        const dataUri = await fileToDataUri(selectedFile);
        setImageDataUri(dataUri);
        handleAnalyze(dataUri);
    }
  };

  const handleAnalyze = async (dataUri: string) => {
    setStatus("analyzing");
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await extractMedicationsFromImage({ imageDataUri: dataUri });
      setAnalysisResult(result);
      setStatus("success");
    } catch (e) {
      console.error(e);
      setError("Failed to analyze the prescription. The image might be unclear. Please try again.");
      setStatus("error");
    }
  };
  
  const handleRetry = () => {
      setStatus('idle');
      setImageDataUri(null);
      setAnalysisResult(null);
      setError(null);
  }

  const handleAddToMeds = async () => {
    if (!analysisResult?.medications || analysisResult.medications.length === 0) return;

    try {
      // Save all medicines to backend
      const promises = analysisResult.medications.map(med =>
        fetch('/api/medicines', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: med.name,
            dosage: med.dosage || 'Not specified',
            time: '9:00 AM', // Default time, user can edit later
            frequency: 'Once daily', // Default
          }),
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.ok);

      if (failed.length > 0) {
        toast({
          variant: 'destructive',
          title: "Error",
          description: `Failed to add ${failed.length} medication(s). Please try again.`,
        });
        return;
      }

      // Refresh medicines from backend
      await refreshMedicines();

      toast({
        title: "Medications Added!",
        description: `${analysisResult.medications.length} new medication(s) have been added to your tracker.`,
      });

      router.push('/dashboard/med-tracker');
    } catch (error) {
      console.error('Error adding medicines:', error);
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Failed to add medications. Please try again.",
      });
    }
  }

  const renderContent = () => {
    switch (status) {
      case 'capturing':
        return (
          <div className="w-full aspect-[9/16] max-h-[70svh] relative rounded-lg overflow-hidden bg-black flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            {!hasCameraPermission && (
                 <Alert variant="destructive" className="m-4">
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                        Please allow camera access to use this feature.
                    </AlertDescription>
                </Alert>
            )}
             <Button size="icon" className="absolute bottom-6 h-16 w-16 rounded-full" onClick={handleCapture} disabled={!hasCameraPermission}>
                <Camera className="h-8 w-8" />
             </Button>
          </div>
        );
      case 'analyzing':
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <h2 className="text-xl font-semibold">Analyzing Prescription...</h2>
                <p className="text-muted-foreground">The AI is reading the image.</p>
                {imageDataUri && <img src={imageDataUri} alt="Prescription" className="mt-4 rounded-lg max-w-full h-auto max-h-64 opacity-50" />}
            </div>
        )
      case 'success':
         return (
            <div className="p-4 space-y-4">
                <h2 className="text-xl font-bold font-headline flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/> Extracted Medications</h2>
                {analysisResult?.medications && analysisResult.medications.length > 0 ? (
                    <div className="space-y-3">
                        {analysisResult.medications.map((med, index) => (
                            <Card key={index}>
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-full">
                                        <Pill className="h-5 w-5 text-primary"/>
                                    </div>
                                    <div>
                                        <p className="font-semibold">{med.name}</p>
                                        <p className="text-sm text-muted-foreground">{med.dosage}</p>
                                    </div>
                                    <Badge variant="secondary" className="ml-auto">New</Badge>
                                </CardContent>
                            </Card>
                        ))}
                         <Button className="w-full" onClick={handleAddToMeds}>Add to My Meds</Button>
                    </div>
                ) : (
                     <div className="text-center py-10 border-2 border-dashed rounded-lg">
                        <Pill className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">No Medications Found</h3>
                        <p className="mt-1 text-sm text-muted-foreground">The AI couldn't identify any medications in this image.</p>
                    </div>
                )}
                 <Button variant="outline" className="w-full" onClick={handleRetry}><RefreshCw className="mr-2 h-4 w-4"/> Scan Another</Button>
            </div>
        )
      case 'error':
          return (
            <div className="p-4">
                 <Alert variant="destructive">
                    <AlertTitle>Analysis Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button variant="outline" className="w-full mt-4" onClick={handleRetry}>Try Again</Button>
            </div>
          )
      default: // idle
        return (
          <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold font-headline text-center">Scan Prescription</h1>
            <p className="text-muted-foreground text-center">Take a photo of your prescription or upload an image to automatically add medications to your tracker.</p>
            <div className="space-y-4">
              <Button size="lg" className="w-full" onClick={() => setStatus('capturing')}>
                <Camera className="mr-2 h-5 w-5" />
                Take Photo
              </Button>
              <Button size="lg" variant="secondary" className="w-full" onClick={() => fileInputRef.current?.click()}>
                <FileUp className="mr-2 h-5 w-5" />
                Upload Image
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-card sm:bg-background">
      <header className="p-4 flex items-center gap-4 border-b sm:hidden">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h2 className="font-semibold">Add from Prescription</h2>
      </header>
      <main className="max-w-md mx-auto sm:pt-8">
        <div className="bg-card rounded-lg sm:shadow-soft">
            {renderContent()}
        </div>
      </main>
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
