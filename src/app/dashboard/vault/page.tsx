"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Shield, FileText, Activity, Image as ImageIcon, Pill, ChevronDown } from "lucide-react";
import { format } from 'date-fns';
import { SecretVaultModal } from "@/components/dashboard/secret-vault-modal";

export default function VaultPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isVerified, setIsVerified] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const verified = searchParams.get('verified') === 'true';
        if (verified) {
            setIsVerified(true);
        } else {
            setIsModalOpen(true);
        }
    }, [searchParams]);

    const categories = ['All', 'Blood Reports', 'Scans & Imaging', 'Prescriptions'];

    const getCategoryIcon = (categoryStr: string) => {
        switch (categoryStr.toLowerCase()) {
            case 'blood': return <Activity className="w-5 h-5 text-rose-500" />;
            case 'imaging': return <ImageIcon className="w-5 h-5 text-indigo-500" />;
            case 'prescription': return <Pill className="w-5 h-5 text-blue-500" />;
            default: return <FileText className="w-5 h-5 text-slate-500" />;
        }
    };

    const fetchReports = async (category: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/vault/list?category=${encodeURIComponent(category)}`);
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

    useEffect(() => {
        if (isVerified) {
            fetchReports(selectedCategory);
        }
    }, [selectedCategory, isVerified]);

    if (!isVerified) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <SecretVaultModal 
                    isOpen={isModalOpen}
                    onClose={() => router.push('/dashboard')}
                    onSuccess={() => {
                        setIsVerified(true);
                        setIsModalOpen(false);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24 sm:pb-8 font-sans bg-[#F8FAFC] min-h-screen">

            {/* Header */}
            <div className="bg-slate-900 rounded-b-[32px] sm:rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden -mx-4 -mt-4 sm:mx-0 sm:mt-0">
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                            <Lock className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
                            <Shield className="w-3.5 h-3.5" /> End-to-End Encrypted
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold font-playfair tracking-tight mb-2">My Vault</h1>
                    <p className="text-slate-400 max-w-sm text-sm leading-relaxed">
                        Your private repository for AI-analyzed lab reports and clinical documents. Completely secure.
                    </p>
                </div>
                {/* Decorative background circle */}
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#02B69A] opacity-20 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
            </div>

            <div className="px-1 sm:px-0">
                {/* Filter Chips */}
                <div className="flex overflow-x-auto pb-4 gap-2 snap-x hide-scrollbar mb-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`snap-start shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border ${selectedCategory === cat
                                    ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Reports List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse bg-white rounded-2xl h-32 border border-slate-100"></div>
                        ))}
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-white rounded-[24px] p-10 text-center border border-slate-100 shadow-sm flex flex-col items-center mt-4">
                        <div className="h-16 w-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                            <FileText className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 font-playfair">Vault is Empty</h3>
                        <p className="text-slate-500 mt-2 max-w-xs text-sm">No reports found in this category. Navigate to Reports to analyze and save new documents.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reports.map((report) => (
                            <Card key={report._id} className="border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-[24px] overflow-hidden group">
                                <CardContent className="p-0">
                                    {/* Card Header (Clickable/Accordion Trigger conceptually) */}
                                    <div className="p-5 flex items-start gap-4 bg-white relative z-10">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${report.category === 'blood' ? 'bg-rose-50 border-rose-100' :
                                                report.category === 'imaging' ? 'bg-indigo-50 border-indigo-100' :
                                                    report.category === 'prescription' ? 'bg-blue-50 border-blue-100' :
                                                        'bg-slate-50 border-slate-200'
                                            }`}>
                                            {getCategoryIcon(report.category)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 text-base truncate pr-8">{report.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wide">
                                                    {report.category}
                                                </span>
                                                <span className="text-xs text-slate-400 whitespace-nowrap">
                                                    {format(new Date(report.date || report.createdAt), 'MMM d, yyyy')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="absolute right-5 top-7 text-slate-300 group-hover:text-slate-500 transition-colors">
                                            <ChevronDown className="w-5 h-5 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* AI Summary Section (Always visible for now, can be accordion) */}
                                    <div className="px-5 pb-5 pt-2 bg-slate-50/50 border-t border-slate-50">
                                        <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-4">
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> AI Summary
                                            </p>
                                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                                {report.summary}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
