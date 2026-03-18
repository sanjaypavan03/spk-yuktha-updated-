"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Shield, 
  Activity, 
  Image as ImageIcon, 
  Pill, 
  ChevronRight,
  ChevronDown,
  Upload,
  Calendar,
  Building2,
  User as UserIcon,
  X,
  FileUp,
  AlertCircle
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { SecretVaultModal } from "@/components/dashboard/secret-vault-modal";
import { cn } from "@/lib/utils";

const reportTypes = [
  { id: 'blood', label: 'Blood Test' },
  { id: 'mri', label: 'MRI Scan' },
  { id: 'ultrasound', label: 'Ultrasound' },
  { id: 'ecg', label: 'ECG' },
  { id: 'urine', label: 'Urine Analysis' },
  { id: 'thyroid', label: 'Thyroid Test' },
  { id: 'diabetes', label: 'Diabetes Test' },
  { id: 'allergy', label: 'Allergy Test' },
  { id: 'others', label: 'Other Tests' },
];

export default function ReportsPage() {
    const router = useRouter();
    const { toast } = useToast();
    
    // UI States
    const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
    const [loading, setLoading] = useState(false);
    const [successState, setSuccessState] = useState(false);
    const [extractedData, setExtractedData] = useState<any>(null);
    
    // Form States
    const [reportTitle, setReportTitle] = useState('');
    const [reportType, setReportType] = useState('');
    const [reportDate, setReportDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [hospitalName, setHospitalName] = useState('');
    const [profileLink, setProfileLink] = useState('Myself');
    const [file, setFile] = useState<File | null>(null);
    const [rawText, setRawText] = useState('');

    // Vault States
    const [vaultReports, setVaultReports] = useState<any[]>([]);
    const [vaultLoading, setVaultLoading] = useState(true);
    const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
    const [isVaultVerified, setIsVaultVerified] = useState(false);

    const fetchRecentVault = async () => {
        try {
            const res = await fetch('/api/vault/list?limit=3');
            if (res.ok) {
                const data = await res.json();
                setVaultReports(data.reports || []);
            }
        } catch (error) {
            console.error('Failed to fetch recent vault:', error);
        } finally {
            setVaultLoading(false);
        }
    };

    useEffect(() => {
        if (isVaultVerified) {
            fetchRecentVault();
        }
    }, [isVaultVerified]);

    const handleAnalyze = async (mode: 'upload' | 'paste') => {
        const textToAnalyze = mode === 'paste' ? rawText : `File Upload: ${reportTitle} at ${hospitalName}. ${reportType} report.`;
        
        if (mode === 'paste' && !rawText.trim()) {
            toast({ variant: 'destructive', description: 'Please paste report text to analyze.' });
            return;
        }

        if (mode === 'upload' && !file) {
            toast({ variant: 'destructive', description: 'Please select a report file to upload.' });
            return;
        }

        setLoading(true);
        try {
            // 1. Analyze with AI
            const analyzeRes = await fetch('/api/vault/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rawText: textToAnalyze })
            });

            const analyzeData = await analyzeRes.json();

            if (!analyzeRes.ok || !analyzeData.success) {
                toast({ variant: 'destructive', description: analyzeData.error || 'Failed to analyze report.' });
                setLoading(false);
                return;
            }

            const { extracted } = analyzeData;
            
            // Override with form metadata if upload mode
            if (mode === 'upload') {
                extracted.reportTitle = reportTitle || extracted.reportTitle;
                extracted.category = reportType || extracted.category;
                extracted.clinic = hospitalName;
                extracted.date = reportDate;
            }

            setExtractedData(extracted);

            // 2. Save to Secure Vault
            const saveRes = await fetch('/api/vault/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(extracted)
            });

            if (saveRes.ok) {
                setSuccessState(true);
                toast({ title: 'Success', description: 'Report analyzed and securely saved in Vault.' });
                setTimeout(() => {
                    router.push('/dashboard/vault/secure');
                }, 3000);
            } else {
                toast({ variant: 'destructive', description: 'Analysis succeeded, but saving failed.' });
            }

        } catch (error) {
            toast({ variant: 'destructive', description: 'An unexpected error occurred.' });
        } finally {
            if (!successState) setLoading(false);
        }
    };

    if (successState && extractedData) {
        return (
            <div className="space-y-6 pb-24 sm:pb-8 font-sans bg-[#F8FAFC] min-h-[80vh] flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-2xl border border-emerald-100 max-w-lg w-full text-center animate-in zoom-in-95 duration-500">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 border border-emerald-100">
                        <CheckCircle2 className="w-8 h-8 sm:w-12 sm:h-12" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold font-playfair text-slate-900 mb-2 sm:mb-3 leading-tight px-2">Saved to Secure Vault 🔒</h2>
                    <p className="text-[13px] sm:text-base text-slate-500 mb-6 sm:mb-8 font-medium px-2">Your report was encrypted and auto-categorized under <span className="text-indigo-600 font-bold uppercase">{extractedData.category}</span>.</p>

                    <div className="bg-slate-50 rounded-[24px] sm:rounded-3xl p-5 sm:p-6 text-left border border-slate-100 mb-6 sm:mb-8 space-y-4">
                        <div>
                            <p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Report Identity</p>
                            <p className="font-bold text-slate-800 text-base sm:text-lg line-clamp-1">{extractedData.reportTitle}</p>
                        </div>
                        {extractedData.parameters?.length > 0 && (
                            <div>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Key Parameters</p>
                                <div className="space-y-2">
                                    {extractedData.parameters.slice(0, 3).map((p: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600 font-medium">{p.test}</span>
                                            <span className={cn(
                                                "font-bold px-2 py-0.5 rounded-lg",
                                                p.status === 'High' || p.status === 'Low' ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                                            )}>{p.value} {p.unit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-center gap-2 text-indigo-600 font-bold text-sm animate-pulse">
                        Opening Secure Vault <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-24 sm:pb-8 font-sans bg-[#F8FAFC] min-h-screen p-4 sm:p-8 lg:p-12 max-w-5xl mx-auto">
            
            {/* Header Section */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[24px] sm:rounded-[32px] p-6 sm:p-12 text-white shadow-2xl relative overflow-hidden">
                <div className="relative max-w-md group w-full">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4 opacity-80">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" />
                        <span className="font-bold tracking-widest text-[9px] sm:text-[10px] uppercase">Yuktha AI Health Intelligence</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-bold font-playfair tracking-tight mb-3 sm:mb-4 leading-tight">Analyze Lab Report</h1>
                    <p className="text-indigo-100/80 max-w-xl text-[13px] sm:text-base leading-relaxed font-medium">
                        Upload your medical reports or paste raw results. Our advanced AI extracts parameters and secures them in your vault.
                    </p>
                    
                    <div className="mt-6 sm:mt-8 flex flex-row flex-wrap gap-2 sm:gap-4">
                        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 rounded-full border border-white/5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> HIPAA Compliant
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 rounded-full border border-white/5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" /> E2EE Secured
                        </div>
                    </div>
                </div>
                {/* Abstract background glow */}
                <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500/20 rounded-full blur-[80px] sm:blur-[100px] -mr-32 -mt-32 sm:-mr-48 sm:-mt-48"></div>
            </div>

            {/* Main Interaction Area */}
            <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
                {/* Tabs Switcher */}
                <div className="flex p-2 bg-slate-50/80 border-b border-slate-100">
                    <button 
                        onClick={() => setActiveTab('upload')}
                        className={cn(
                            "flex-1 py-4 rounded-3xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                            activeTab === 'upload' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <Upload className="w-4 h-4" /> Upload Report
                    </button>
                    <button 
                        onClick={() => setActiveTab('paste')}
                        className={cn(
                            "flex-1 py-4 rounded-3xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                            activeTab === 'paste' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <FileText className="w-4 h-4" /> Paste Raw Text
                    </button>
                </div>

                <div className="p-6 sm:p-10">
                    {activeTab === 'upload' ? (
                        /* Upload Form Section */
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Report Title</label>
                                    <div className="relative">
                                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <input 
                                            type="text" 
                                            placeholder="e.g., Annual Lab Checkup"
                                            value={reportTitle}
                                            onChange={(e) => setReportTitle(e.target.value)}
                                            className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-100 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Report Type</label>
                                    <div className="relative">
                                        <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                                        <select 
                                            value={reportType}
                                            onChange={(e) => setReportType(e.target.value)}
                                            className="w-full pl-11 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 appearance-none focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-100 transition-all font-medium cursor-pointer"
                                        >
                                            <option value="">Auto-Detect (AI)</option>
                                            {reportTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Report Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <input 
                                            type="date" 
                                            value={reportDate}
                                            onChange={(e) => setReportDate(e.target.value)}
                                            className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-100 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Hospital / Clinic</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <input 
                                            type="text" 
                                            placeholder="e.g., City Medical Center"
                                            value={hospitalName}
                                            onChange={(e) => setHospitalName(e.target.value)}
                                            className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-100 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Link to Profile</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                                    <select 
                                        value={profileLink}
                                        onChange={(e) => setProfileLink(e.target.value)}
                                        className="w-full pl-11 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 appearance-none focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-100 transition-all font-medium cursor-pointer"
                                    >
                                        <option value="Myself">Myself</option>
                                        <option value="Family Member">Family Member</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Select Report File (PDF/Image)</label>
                                <div className={cn(
                                    "border-2 border-dashed rounded-[32px] p-8 text-center transition-all cursor-pointer group hover:bg-indigo-50/30",
                                    file ? "border-emerald-200 bg-emerald-50/30" : "border-slate-100"
                                )}>
                                    <input 
                                        type="file" 
                                        id="report-file" 
                                        className="hidden" 
                                        accept="image/*,.pdf"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    <label htmlFor="report-file" className="cursor-pointer block">
                                        <div className={cn(
                                            "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all",
                                            file ? "bg-emerald-100 text-emerald-500 scale-110" : "bg-slate-50 text-slate-300 group-hover:bg-indigo-100 group-hover:text-indigo-500"
                                        )}>
                                            {file ? <CheckCircle2 className="w-8 h-8" /> : <FileUp className="w-8 h-8" />}
                                        </div>
                                        {file ? (
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-800">{file.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Selected for encryption</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">Click to browse or drag & drop</p>
                                                <p className="text-xs text-slate-400 font-medium font-sans">Supports images and PDF medical records</p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <Button 
                                onClick={() => handleAnalyze('upload')}
                                disabled={loading || !file}
                                className="w-full py-8 rounded-[24px] bg-slate-900 hover:bg-black text-white font-bold text-lg shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <Sparkles className="w-5 h-5 animate-pulse text-indigo-400" />
                                        Analyzing Health Data...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 text-indigo-400" />
                                        Analyze & Secure in Vault 🔒
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        /* Paste Text Section */
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Paste Raw Report Text</label>
                                <textarea
                                    className="w-full h-80 bg-slate-50 border border-slate-100 rounded-[32px] p-6 text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-100 resize-none leading-relaxed transition-all font-medium"
                                    placeholder="Paste the text from your lab report, prescription, or clinical notes here..."
                                    value={rawText}
                                    onChange={(e) => setRawText(e.target.value)}
                                ></textarea>
                            </div>

                            <Button 
                                onClick={() => handleAnalyze('paste')}
                                disabled={loading || !rawText.trim()}
                                className="w-full py-8 rounded-[24px] bg-slate-900 hover:bg-black text-white font-bold text-lg shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <Sparkles className="w-5 h-5 animate-pulse text-indigo-400" />
                                        Processing Deep Analysis...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 text-indigo-400" />
                                        Analyze & Secure in Vault 🔒
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Secret Vault Entry Points (If verified) */}
            <div className="pt-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800 font-playfair tracking-tight">Recent Secure Documents</h2>
                    <Button 
                        variant="ghost" 
                        onClick={() => {
                            if (isVaultVerified) router.push('/dashboard/vault/secure');
                            else setIsVaultModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-700 font-bold text-sm"
                    >
                        {isVaultVerified ? 'Go to Vault' : 'Unlock Vault'} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
                
                {(!isVaultVerified || vaultReports.length === 0) ? (
                    <div className="bg-white border border-slate-100 rounded-[32px] p-12 text-center shadow-sm">
                        <Lock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="font-bold text-slate-800 font-playfair mb-1">Vault Content Hidden</h3>
                        <p className="text-slate-400 text-sm font-medium">Verify your PIN to see your secure reports.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {vaultReports.map((report) => (
                             <Card 
                                key={report._id} 
                                onClick={() => router.push('/dashboard/vault/secure')}
                                className="border-slate-100 shadow-sm hover:shadow-md transition-all rounded-[28px] overflow-hidden cursor-pointer group"
                            >
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800 text-sm truncate">{report.title}</p>
                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{report.category} • {format(new Date(report.createdAt), 'MMM d, yyyy')}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <SecretVaultModal 
                isOpen={isVaultModalOpen}
                onClose={() => setIsVaultModalOpen(false)}
                onSuccess={() => {
                    sessionStorage.setItem('vault_authenticated', 'true');
                    setIsVaultVerified(true);
                    setIsVaultModalOpen(false);
                    router.push('/dashboard/vault/secure');
                }}
            />

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                
                body {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                }
                
                .font-playfair {
                    font-family: 'Playfair Display', serif;
                }
            `}</style>
        </div>
    );
}
