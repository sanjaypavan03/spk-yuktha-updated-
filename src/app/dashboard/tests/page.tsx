"use client";

import { useEffect, useState, useRef } from "react";
import { TestTube2, Upload, CheckCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";

interface TestRecommendation {
  _id: string;
  testName: string;
  urgency: 'Routine' | 'Urgent' | 'Emergency';
  notes?: string;
  status: string;
  doctorId: { name: string };
  createdAt: string;
}

export default function TestsPage() {
  const [recommendations, setRecommendations] = useState<TestRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetch('/api/patient/test-recommendations');
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations || []);
        }
      } catch (e) {
        console.error("Failed to fetch test recommendations:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const urgencyStyles: Record<string, string> = {
    Routine: 'bg-slate-100 text-slate-600',
    Urgent: 'bg-amber-50 text-amber-600 border border-amber-200',
    Emergency: 'bg-rose-50 text-rose-600 border border-rose-200',
  };

  const handleUpload = async (rec: TestRecommendation, file: File) => {
    setUploadingId(rec._id);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;

        // 1. Upload the report
        const reportRes = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: rec.testName + ' Result',
            type: 'blood',
            date: new Date(),
            fileData: base64,
            fileName: file.name,
            analysis: {
              reportSummary: 'Uploaded for test: ' + rec.testName,
              documentType: rec.testName,
              extractedMetadata: {
                title: rec.testName,
                date: new Date().toISOString(),
                type: 'test-result',
                clinic: 'Patient Upload'
              }
            }
          })
        });

        if (reportRes.ok) {
          // 2. Mark test as done
          await fetch('/api/patient/test-recommendations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: rec._id, status: 'done' })
          });

          // 3. Update local state
          setRecommendations(prev =>
            prev.map(r => r._id === rec._id ? { ...r, status: 'done' } : r)
          );
        }
        setUploadingId(null);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error("Upload failed:", e);
      setUploadingId(null);
    }
  };

  const pendingTests = recommendations.filter(r => r.status !== 'done');
  const completedTests = recommendations.filter(r => r.status === 'done');

  const renderTestCard = (rec: TestRecommendation, isPending: boolean) => (
    <div
      key={rec._id}
      className={`bg-white rounded-[20px] p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ${!isPending ? 'opacity-70' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-[16px] font-bold text-slate-900">{rec.testName}</h3>
        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${urgencyStyles[rec.urgency]}`}>
          {rec.urgency}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <p className="text-[12px] text-slate-500 font-medium">Dr. {rec.doctorId?.name}</p>
        <span className="text-slate-300">•</span>
        <p className="text-[12px] text-slate-400">{formatDate(rec.createdAt)}</p>
      </div>

      {rec.notes && (
        <p className="text-[13px] text-slate-500 leading-relaxed mb-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
          {rec.notes}
        </p>
      )}

      {isPending && (
        <div className="mt-3">
          <input
            type="file"
            accept="image/*,.pdf"
            ref={el => { fileInputRefs.current[rec._id] = el; }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(rec, file);
            }}
            className="hidden"
          />
          <button
            onClick={() => fileInputRefs.current[rec._id]?.click()}
            disabled={uploadingId === rec._id}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[13px] rounded-xl border border-emerald-200 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {uploadingId === rec._id ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="w-4 h-4" /> Upload Result</>
            )}
          </button>
        </div>
      )}

      {!isPending && (
        <div className="flex items-center gap-2 mt-2 text-emerald-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-[12px] font-bold">Result Uploaded</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-24 sm:pb-8 font-sans bg-[#F9FAFB] min-h-screen p-4 pt-1 sm:px-8 sm:pt-2">
      <div className="pt-1">
        <h1 className="text-[24px] font-bold text-slate-900 font-playfair tracking-tight mb-1">Lab Tests</h1>
        <p className="text-[13px] text-slate-500 font-medium">Tests ordered by your doctors</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-[20px] h-32 border border-slate-100" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="bg-white rounded-[24px] p-8 sm:p-12 text-center border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mt-8">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <TestTube2 className="w-8 h-8 text-slate-300" />
          </div>
          <p className="font-bold text-slate-800 text-[16px] mb-1">No test recommendations</p>
          <p className="text-slate-400 text-[13px] max-w-[260px] mx-auto leading-relaxed">
            When your doctor orders lab tests, they will appear here.
          </p>
        </div>
      ) : (
        <div className="pt-2 space-y-8">
          {pendingTests.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-amber-500" />
                <h2 className="text-[18px] font-bold text-slate-900 font-playfair tracking-tight">Pending Tests</h2>
                <span className="bg-amber-50 text-amber-600 text-[11px] font-black px-2 py-0.5 rounded-md border border-amber-200">
                  {pendingTests.length}
                </span>
              </div>
              <div className="space-y-4">
                {pendingTests.map(r => renderTestCard(r, true))}
              </div>
            </div>
          )}

          {completedTests.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <h2 className="text-[18px] font-bold text-slate-900 font-playfair tracking-tight">Completed Tests</h2>
              </div>
              <div className="space-y-4">
                {completedTests.map(r => renderTestCard(r, false))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
