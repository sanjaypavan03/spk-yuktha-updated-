"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload, Search, User, X, FileText, CheckCircle2, Loader2, File
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PremiumDatePicker } from "@/components/ui/premium-date-picker";

const CATEGORIES = [
  'Blood Report', 'Scan & Imaging', 'Prescription', 'Pathology',
  'ECG', 'X-Ray', 'MRI', 'Ultrasound', 'Other'
];

const CATEGORY_MAP: Record<string, string> = {
  'Blood Report': 'blood', 'Scan & Imaging': 'scan', 'Prescription': 'prescription',
  'Pathology': 'pathology', 'ECG': 'ecg', 'X-Ray': 'xray', 'MRI': 'mri',
  'Ultrasound': 'ultrasound', 'Other': 'other'
};

export default function ReceptionistUploadReportPage() {
  const { toast } = useToast();

  // Patient search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Hospital name
  const [hospitalName, setHospitalName] = useState('');

  // Report form
  const [category, setCategory] = useState('Blood Report');
  const [title, setTitle] = useState('Blood Report');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [clinicName, setClinicName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const inputClass = "w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#02B69A] focus:ring-1 focus:ring-[#02B69A] transition-colors";

  useEffect(() => {
    fetch('/api/receptionist/me').then(r => r.json()).then(d => {
      const name = d.user?.name || '';
      setHospitalName(name);
      setClinicName(name);
    }).catch(() => {});
  }, []);

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/hospital/patient-search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.patients || []);
      }
    } catch (e) { console.error(e); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, search]);

  useEffect(() => {
    setTitle(category);
  }, [category]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedPatient || !selectedFile) {
      toast({ variant: 'destructive', description: 'Select a patient and file.' });
      return;
    }
    setUploading(true);
    setUploadProgress(20);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        setUploadProgress(50);
        const base64 = e.target?.result as string;

        const res = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: selectedPatient._id,
            title,
            type: CATEGORY_MAP[category] || 'other',
            date: reportDate,
            clinic: clinicName,
            fileDataUri: base64,
            analysis: {
              reportSummary: 'Uploaded by ' + hospitalName,
              documentType: category,
              executiveSummary: 'Report uploaded directly by receptionist staff.',
              extractedMetadata: { title, date: reportDate, type: category, clinic: clinicName }
            }
          })
        });

        setUploadProgress(90);

        if (res.ok) {
          setUploadProgress(100);
          setSuccess({ patientName: selectedPatient.name, reportTitle: title });
          toast({ title: 'Report Uploaded' });
        } else {
          const data = await res.json();
          toast({ variant: 'destructive', description: data.error || 'Upload failed' });
        }
        setUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (e) {
      toast({ variant: 'destructive', description: 'Upload failed' });
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSuccess(null);
    setSelectedPatient(null);
    setSearchQuery('');
    setSelectedFile(null);
    setCategory('Blood Report');
    setTitle('Blood Report');
    setReportDate(new Date().toISOString().split('T')[0]);
    setUploadProgress(0);
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-slate-900 border border-[#02B69A]/30 rounded-[32px] p-10 text-center max-w-md w-full space-y-4">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white font-playfair">Report Uploaded</h2>
          <div className="bg-black/50 rounded-xl p-4 border border-slate-800 text-left space-y-2">
            <p className="text-sm text-slate-300"><span className="text-slate-500">Patient:</span> {success.patientName}</p>
            <p className="text-sm text-slate-300"><span className="text-slate-500">Report:</span> {success.reportTitle}</p>
          </div>
          <button onClick={resetForm} className="w-full py-3 bg-[#02B69A] hover:bg-[#00D4AA] text-slate-950 font-bold rounded-xl transition-all">
            Upload Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white font-playfair tracking-tight mb-1">Upload Report</h2>
        <p className="text-slate-400 font-medium text-sm">Upload lab reports and documents for patients.</p>
      </div>

      {/* Step 1 — Patient Search */}
      <Card className="bg-slate-900 border-slate-800 shadow-none">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-sm font-black text-[#02B69A] uppercase tracking-widest flex items-center gap-2">
            <Search className="w-4 h-4" /> Step 1 — Select Patient
          </h3>

          {selectedPatient ? (
            <div className="flex items-center justify-between bg-[#02B69A]/10 border border-[#02B69A]/20 rounded-xl px-5 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#02B69A]" />
                <div>
                  <p className="text-sm font-bold text-white">{selectedPatient.name}</p>
                  <p className="text-[11px] text-slate-400">{selectedPatient.phone || selectedPatient.email}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedPatient(null); setSearchQuery(''); }} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input className={`${inputClass} pl-10`} placeholder="Search patient by name, phone, or email..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 animate-spin" />}

              {searchResults.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl max-h-48 overflow-y-auto shadow-2xl">
                  {searchResults.map(p => (
                    <div key={p._id} onClick={() => { setSelectedPatient(p); setSearchQuery(''); setSearchResults([]); }}
                      className="px-4 py-3 hover:bg-slate-800 cursor-pointer flex items-center gap-3 border-b border-slate-800/50 last:border-0">
                      <User className="w-4 h-4 text-slate-500" />
                      <div><p className="text-sm text-white font-bold">{p.name}</p><p className="text-[11px] text-slate-500">{p.phone || p.email}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2 — Report Details */}
      {selectedPatient && (
        <Card className="bg-slate-900 border-slate-800 shadow-none">
          <CardContent className="p-6 space-y-5">
            <h3 className="text-sm font-black text-[#02B69A] uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-4 h-4" /> Step 2 — Report Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 block">Category</label>
                <select className={inputClass} value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 block">Report Title</label>
                <input className={inputClass} value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <PremiumDatePicker
                label="Date of Report"
                value={reportDate}
                onChange={setReportDate}
                className="w-full"
              />
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 block">Clinic / Lab</label>
                <input className={inputClass} value={clinicName} onChange={e => setClinicName(e.target.value)} />
              </div>
            </div>

            {/* Drag and Drop */}
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-[#02B69A]/50 rounded-2xl p-8 text-center cursor-pointer transition-colors"
            >
              <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden"
                onChange={e => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }} />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <File className="w-8 h-8 text-[#02B69A]" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="text-slate-500 hover:text-rose-400 ml-4">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold text-sm">Drop file here or click to browse</p>
                  <p className="text-[11px] text-slate-600 mt-1">PDF or images accepted</p>
                </>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#02B69A] transition-all duration-500" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="text-[11px] text-slate-500 text-center">Processing file... {uploadProgress}%</p>
              </div>
            )}

            <button onClick={handleUpload} disabled={uploading || !selectedFile}
              className="w-full py-3 bg-[#02B69A] hover:bg-[#00D4AA] text-slate-950 font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload Report</>}
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
