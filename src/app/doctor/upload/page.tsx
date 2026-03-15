
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, ClipboardPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { mockPatients } from "@/lib/data";

export default function UploadPrescriptionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [patientId, setPatientId] = useState<string>('');
  const { toast } = useToast();
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !patientId) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please select a patient and a file to upload.",
        });
        return;
    };

    setIsUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
        setIsUploading(false);
        setFile(null);
        // Clear file input visually
        const fileInput = document.getElementById('prescription-file') as HTMLInputElement;
        if(fileInput) fileInput.value = '';

        setPatientId('');
        toast({
            title: "Success!",
            description: `Prescription uploaded for patient ${mockPatients.find(p => p.id === patientId)?.name}.`,
        });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Upload Prescription</h1>
      <p className="text-muted-foreground">Select a patient and upload their new prescription file.</p>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>New Prescription</CardTitle>
          <CardDescription>The prescription will be immediately available to the patient.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="patient-select">Select Patient</Label>
                <Select onValueChange={setPatientId} value={patientId}>
                    <SelectTrigger id="patient-select">
                        <SelectValue placeholder="Select a patient..." />
                    </SelectTrigger>
                    <SelectContent>
                        {mockPatients.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="prescription-file">Prescription File</Label>
                <Input id="prescription-file" type="file" onChange={handleFileChange} accept="image/*,application/pdf"/>
            </div>
            <Button onClick={handleUpload} disabled={isUploading} className="w-full">
              { isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
              ) : (
                  <ClipboardPlus className="mr-2 h-4 w-4"/>
              )}
              Upload and Notify Patient
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
