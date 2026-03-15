"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

export default function ReportsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [rawText, setRawText] = useState('');
    const [loading, setLoading] = useState(false);
    const [successState, setSuccessState] = useState(false);
    const [extractedData, setExtractedData] = useState<any>(null);

    const handleAnalyze = async () => {
        if (!rawText.trim()) {
            toast({ variant: 'destructive', description: 'Please paste report text to analyze.' });
            return;
        }

        setLoading(true);
        try {
            // 1. Analyze with Google Genkit AI
            const analyzeRes = await fetch('/api/vault/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rawText })
            });

            const analyzeData = await analyzeRes.json();

            if (!analyzeRes.ok || !analyzeData.success) {
                toast({ variant: 'destructive', description: analyzeData.error || 'Failed to analyze report.' });
                setLoading(false);
                return;
            }

            const { extracted } = analyzeData;
            setExtractedData(extracted);

            // 2. Automatically save to Secure Vault
            const saveRes = await fetch('/api/vault/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(extracted)
            });

            if (saveRes.ok) {
                setSuccessState(true);
                toast({ title: 'Success', description: 'Report analyzed and securely saved to vault.' });
                // Redirect after a brief moment to show success state
                setTimeout(() => {
                    router.push('/dashboard/vault');
                }, 2500);
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
                <div className="bg-white p-8 rounded-[32px] shadow-xl border border-emerald-100 max-w-md w-full text-center animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold font-playfair text-slate-800 mb-2">Analysis Complete!</h2>
                    <p className="text-slate-500 mb-6 font-medium">Your report has been securely saved to the Vault.</p>

                    <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100 mb-6">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Detected Report</p>
                        <p className="font-bold text-slate-800">{extractedData.reportTitle}</p>
                        <div className="mt-3">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">AI Summary</p>
                            <p className="text-sm text-slate-600 leading-relaxed">{extractedData.analysisText}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-[#02B69A] font-semibold text-sm animate-pulse">
                        Redirecting to Vault <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24 sm:pb-8 font-sans bg-[#F8FAFC] min-h-screen p-4 sm:p-8 lg:p-12">

            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[24px] p-6 sm:p-8 text-white shadow-lg relative overflow-hidden -mx-4 -mt-4 sm:mx-0 sm:mt-0">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 opacity-90">
                        <Sparkles className="w-5 h-5" />
                        <span className="font-semibold tracking-wide text-sm uppercase">Yuktha AI Engine</span>
                    </div>
                    <h1 className="text-3xl font-bold font-playfair tracking-tight mb-2">Analyze Lab Report</h1>
                    <p className="text-indigo-100 max-w-md text-sm leading-relaxed">
                        Paste your raw lab results or medical text below. Our medical AI will extract the key findings, categorize the document, and securely save it to your Vault.
                    </p>
                </div>
                {/* Decorative background circle */}
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
            </div>

            <div className="pt-2">
                <Card className="border-none shadow-md rounded-[24px] overflow-hidden">
                    <CardContent className="p-0">
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                <FileText className="w-4 h-4" /> Raw Report Text
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                <ShieldCheck className="w-3.5 h-3.5" /> HIPAA Compliant
                            </div>
                        </div>
                        <div className="p-4 sm:p-6 bg-white">
                            <textarea
                                className="w-full h-64 sm:h-80 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none leading-relaxed transition-all"
                                placeholder="Paste the text from your lab report, prescription, or clinical notes here..."
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                            ></textarea>

                            <Button
                                onClick={handleAnalyze}
                                disabled={loading || !rawText.trim()}
                                className="w-full mt-6 py-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base transition-all shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Sparkles className="w-5 h-5 animate-pulse text-indigo-300" />
                                        Analyzing Report...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 text-indigo-300" />
                                        Analyze & Save to Vault
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
