"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BrainCircuit, 
  HeartPulse, 
  Droplets, 
  TestTube2, 
  Activity, 
  ShieldAlert, 
  ClipboardCheck, 
  Microscope, 
  Share2,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Search,
  Plus,
  FileText,
  Sparkles,
  X,
  AlertCircle,
  CheckCircle2,
  Info,
  Lock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const categories = [
  { id: 'mri', label: 'MRI Scan', icon: BrainCircuit, bg: 'bg-[#eff6ff]', color: 'text-blue-600', border: 'border-blue-100' },
  { id: 'ultrasound', label: 'Ultrasound', icon: HeartPulse, bg: 'bg-[#fdf2f8]', color: 'text-pink-600', border: 'border-pink-100' },
  { id: 'blood', label: 'Blood Test', icon: Droplets, bg: 'bg-[#fff7ed]', color: 'text-orange-600', border: 'border-orange-100' },
  { id: 'urine', label: 'Urine Analysis', icon: TestTube2, bg: 'bg-[#fefce8]', color: 'text-yellow-600', border: 'border-yellow-100' },
  { id: 'ecg', label: 'ECG', icon: Activity, bg: 'bg-[#f5f3ff]', color: 'text-violet-600', border: 'border-violet-100' },
  { id: 'thyroid', label: 'Thyroid Test', icon: ShieldAlert, bg: 'bg-[#ecfeff]', color: 'text-cyan-600', border: 'border-cyan-100' },
  { id: 'diabetes', label: 'Diabetes Test', icon: ClipboardCheck, bg: 'bg-[#fffaf0]', color: 'text-orange-500', border: 'border-orange-50' },
  { id: 'allergy', label: 'Allergy Test', icon: Microscope, bg: 'bg-[#f0fdf4]', color: 'text-emerald-600', border: 'border-emerald-100' },
  { id: 'others', label: 'Other Tests', icon: Share2, bg: 'bg-[#f8fafc]', color: 'text-slate-500', border: 'border-slate-100' },
];

export default function SecureVaultPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isVerified, setIsVerified] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [rawText, setRawText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  
  // Detail Modal States
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    const verified = sessionStorage.getItem('vault_authenticated') === 'true';
    if (!verified) {
      router.push('/dashboard/reports');
      return;
    }
    setIsVerified(true);
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/vault/list');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Failed to fetch vault reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeAndSave = async () => {
    if (!rawText.trim()) return;
    setAnalyzing(true);
    try {
      const analyzeRes = await fetch('/api/vault/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText })
      });
      const analyzeData = await analyzeRes.json();
      
      if (!analyzeRes.ok || !analyzeData.success) throw new Error(analyzeData.error || "Analysis failed");

      // Force category if uploaded within one
      if (selectedCat) {
        analyzeData.extracted.category = selectedCat.id;
      }

      const saveRes = await fetch('/api/vault/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analyzeData.extracted)
      });

      if (saveRes.ok) {
        toast({ title: "Success", description: "Report analyzed and saved." });
        setRawText('');
        setIsUploadOpen(false);
        fetchReports();
      }
    } catch (err: any) {
      toast({ variant: "destructive", description: err.message || "Failed to process report." });
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesCat = selectedCat ? r.type?.toLowerCase() === selectedCat.id : true;
    const matchesSearch = searchQuery.trim() === '' || 
      (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r._id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const categoryReports = selectedCat 
    ? reports.filter(r => r.type?.toLowerCase() === selectedCat.id)
    : [];

  if (!isVerified) return null;

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-sans p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="mb-6 sm:mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <Button 
            variant="ghost" 
            onClick={() => selectedCat ? setSelectedCat(null) : router.push('/dashboard/reports')}
            className="text-slate-400 hover:text-slate-600 -ml-2 rounded-xl flex items-center gap-2 px-2 sm:px-4 h-9 sm:h-11"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> 
            <span className="text-xs sm:text-sm font-bold">{selectedCat ? 'Back to Categories' : 'Back to Dashboard'}</span>
          </Button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-[10px] font-black tracking-tight uppercase">
            <ShieldCheck className="w-3.5 h-3.5" /> 
            <span className="hidden xs:inline">Vault Secure • E2EE</span>
            <span className="xs:hidden">Secure</span>
          </div>
        </div>
        
        {selectedCat ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center ${selectedCat.bg} ${selectedCat.border} border shadow-sm`}>
                <selectedCat.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${selectedCat.color}`} />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-slate-900 font-playfair tracking-tight leading-none sm:leading-tight">{selectedCat.label}</h1>
                <p className="text-slate-400 text-[11px] sm:text-sm font-medium">{categoryReports.length} {categoryReports.length === 1 ? 'Report' : 'Reports'} archived</p>
              </div>
            </div>
            <Button 
              onClick={() => setIsUploadOpen(true)}
              className="bg-slate-900 hover:bg-black text-white rounded-2xl px-4 sm:px-6 py-2.5 sm:py-6 h-auto flex items-center gap-2 text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Add New Report
            </Button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 font-playfair mb-1.5 sm:mb-3 tracking-tight">Security Vault</h1>
              <p className="text-slate-400 text-sm sm:text-base font-medium">Select a medical category to review your secured history.</p>
            </div>
            <div className="relative max-w-md group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search by title or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-5 bg-white border border-slate-100 rounded-[24px] text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-100 transition-all font-medium hover:bg-[#FAFBFF] text-sm sm:text-base shadow-sm shadow-slate-200/50"
              />
            </div>
          </div>
        )}
      </div>

      {selectedCat ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
          {filteredReports.length === 0 ? (
            <div className="col-span-full bg-[#FAFBFF]/50 rounded-[40px] p-8 sm:p-20 text-center border-2 border-dashed border-slate-100/60">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-50 shadow-sm shadow-slate-200/50">
                <selectedCat.icon className={`w-8 h-8 sm:w-10 sm:h-10 text-slate-200`} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 font-playfair mb-2">Private Enclave</h3>
              <p className="text-slate-400 text-[13px] sm:text-base font-medium max-w-xs mx-auto mb-8">No {selectedCat.label} records found. Secure your first document to see it here.</p>
              <Button 
                onClick={() => setIsUploadOpen(true)}
                variant="outline"
                className="rounded-2xl px-8 border-slate-200 text-slate-600 font-bold hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all text-xs sm:text-sm"
              >
                Upload {selectedCat.label}
              </Button>
            </div>
          ) : (
            filteredReports.map((report) => (
              <Card key={report._id} className="border-slate-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-[32px] overflow-hidden group bg-white border border-slate-50">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 rounded-xl bg-white border ${selectedCat.border} shadow-sm group-hover:scale-110 transition-transform`}>
                      <selectedCat.icon className={`w-4.5 h-4.5 sm:w-5 h-5 ${selectedCat.color}`} />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-300 tabular-nums uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">
                      {new Date(report.date || report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-base sm:text-lg mb-1.5 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {report.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-black mb-3 uppercase tracking-tighter opacity-70 italic">{report.clinic || 'Medical Center'}</p>
                  <p className="text-[13px] sm:text-sm text-slate-500 leading-relaxed line-clamp-2 sm:line-clamp-3 font-medium mb-6 opacity-80 h-10 sm:h-14 overflow-hidden">
                    {report.analysis?.summary || report.summary || "Medical data encrypted and secured using E2EE."}
                  </p>
                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex gap-1.5 items-center">
                        {report.analysis?.abnormalFindings?.length > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                        )}
                        <span className="text-[8px] sm:text-[9px] font-extrabold text-slate-200 uppercase tracking-widest">
                        ID: {report._id?.slice(-8).toUpperCase()}
                        </span>
                    </div>
                    <button 
                        onClick={() => setSelectedReport(report)}
                        className="text-[11px] sm:text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors flex items-center gap-1 group/btn"
                    >
                      Read Analysis <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 xs:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {categories.map((cat, idx) => (
            <Card 
              key={cat.id} 
              onClick={() => setSelectedCat(cat)}
              className={`cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-none rounded-[20px] sm:rounded-[40px] overflow-hidden group shadow-sm bg-white ring-1 ring-slate-100`}
            >
              <CardContent className="p-0">
                <div className={`p-3 sm:p-8 aspect-square flex flex-col items-center justify-center text-center transition-all duration-500 group-hover:bg-white/90 ${cat.bg}`}>
                  <div className={`w-10 h-10 sm:w-20 sm:h-20 rounded-xl sm:rounded-[28px] mb-2 sm:mb-6 flex items-center justify-center transition-all duration-700 group-hover:scale-110 sm:group-hover:rotate-6 bg-white border border-white/40 shadow-sm ring-4 ring-white/10`}>
                    <cat.icon className={`w-5 h-5 sm:w-10 sm:h-10 ${cat.color} group-hover:scale-110 transition-transform duration-500`} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[10px] sm:text-xl font-bold text-slate-800 font-playfair mb-0 sm:mb-1.5 group-hover:text-black transition-colors line-clamp-1">{cat.label}</h3>
                  <div className="hidden sm:flex items-center gap-1.5 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500 mt-2">
                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Select Archive</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Analysis Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setSelectedReport(null)} />
            <div className="relative w-full max-w-2xl bg-white rounded-[32px] sm:rounded-[44px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 max-h-[95vh] flex flex-col">
                <div className="p-6 sm:p-10 overflow-y-auto">
                    <div className="flex justify-between items-start mb-6 sm:mb-8">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center border border-indigo-100/50">
                                <Sparkles className="w-5 h-5 sm:w-7 sm:h-7" />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-3xl font-bold text-slate-900 font-playfair leading-tight truncate max-w-[200px] sm:max-w-md">{selectedReport.title}</h2>
                                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1">AI Diagnostic Insight</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedReport(null)} className="p-2 sm:p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>

                    <div className="space-y-6 sm:space-y-8">
                        {/* Summary Section */}
                        <div className="bg-[#F8FAFF]/50 border border-slate-100 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8">
                            <h3 className="text-[9px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
                                <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" /> Professional Summary
                            </h3>
                            <p className="text-[13px] sm:text-sm text-slate-700 font-medium leading-relaxed italic">
                                "{selectedReport.analysis?.summary || selectedReport.summary}"
                            </p>
                        </div>

                        {/* Parameters Table */}
                        {selectedReport.analysis?.parameters?.length > 0 && (
                            <div>
                                <h3 className="text-[9px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 px-2">Extracted Parameters</h3>
                                <div className="bg-white border border-slate-100 rounded-[24px] sm:rounded-[32px] overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                            <thead>
                                                <tr className="bg-slate-50/50">
                                                    <th className="px-5 sm:px-6 py-3 sm:py-4 font-black text-[9px] uppercase tracking-widest text-slate-400">Test Parameter</th>
                                                    <th className="px-5 sm:px-6 py-3 sm:py-4 font-black text-[9px] uppercase tracking-widest text-slate-400 text-center">Result</th>
                                                    <th className="px-5 sm:px-6 py-3 sm:py-4 font-black text-[9px] uppercase tracking-widest text-slate-400 text-right">Reference</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {selectedReport.analysis.parameters.map((p: any, i: number) => (
                                                    <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                                        <td className="px-5 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-[13px] sm:text-sm">{p.test}</td>
                                                        <td className="px-5 sm:px-6 py-3 sm:py-4 text-center">
                                                            <span className={cn(
                                                                "px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black tracking-tight",
                                                                p.status === 'High' || p.status === 'Low' || p.status === 'Abnormal'
                                                                    ? "bg-red-50 text-red-600" 
                                                                    : "bg-emerald-50 text-emerald-600"
                                                            )}>
                                                                {p.value} {p.unit}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 sm:px-6 py-3 sm:py-4 text-right text-slate-400 font-medium tabular-nums text-[11px] sm:text-xs">
                                                            {p.referenceRange || 'N/A'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Abnormal Findings */}
                        {selectedReport.analysis?.abnormalFindings?.length > 0 && (
                            <div className="bg-red-50/50 border border-red-100 rounded-[28px] sm:rounded-[32px] p-5 sm:p-8">
                                <h3 className="text-[9px] sm:text-xs font-black text-red-500 uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
                                    <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Priority Findings
                                </h3>
                                <ul className="space-y-2 sm:space-y-3">
                                    {selectedReport.analysis.abnormalFindings.map((finding: string, i: number) => (
                                        <li key={i} className="flex gap-2 sm:gap-3 text-red-700 font-bold text-[12px] sm:text-sm">
                                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                                            {finding}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-5 sm:pt-6 border-t border-slate-100">
                             <div className="flex items-center gap-2 text-[8px] sm:text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400/60" /> Metadata Sign: {selectedReport._id?.slice(-6).toUpperCase()}
                             </div>
                             <Button 
                                variant="ghost" 
                                className="text-[11px] sm:text-xs font-bold text-slate-400 hover:text-slate-600 h-8 sm:h-10"
                                onClick={() => setSelectedReport(null)}
                             >
                                Finalize Review
                             </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Upload Modal (Paste & Analyze) */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !analyzing && setIsUploadOpen(false)} />
          <div className="relative w-full max-w-xl bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsUploadOpen(false)}
              className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${selectedCat ? selectedCat.bg : 'bg-indigo-50'}`}>
                  {selectedCat ? <selectedCat.icon className={`w-5 h-5 ${selectedCat.color}`} /> : <Sparkles className="w-5 h-5 text-indigo-500" />}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-playfair">
                  {selectedCat ? `Add ${selectedCat.label}` : 'New Vault Entry'}
                </h2>
              </div>
              <p className="text-slate-500 font-medium text-xs sm:text-sm">Paste report text carefully. <span className="text-indigo-500">Yuktha AI</span> will categorize it.</p>
            </div>

            <textarea 
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste text from your report..."
              className="w-full h-40 sm:h-64 p-4 bg-slate-50 border border-slate-100 rounded-[20px] sm:rounded-3xl text-sm sm:text-base text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-100 resize-none transition-all mb-6 font-medium leading-relaxed"
            />

            <Button 
              onClick={handleAnalyzeAndSave}
              disabled={analyzing || !rawText.trim()}
              className="w-full py-6 sm:py-7 rounded-[20px] sm:rounded-3xl bg-slate-900 hover:bg-black text-white font-bold text-base sm:text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-200"
            >
              {analyzing ? (
                <>
                  <Sparkles className="w-5 h-5 animate-pulse text-indigo-400" /> 
                  AI Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Save to Secure Vault
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
