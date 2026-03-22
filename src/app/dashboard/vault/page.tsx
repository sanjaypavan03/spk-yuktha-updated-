"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Shield, FileText, Activity, Image as ImageIcon, Pill, ChevronDown, Calendar } from "lucide-react";
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
        <div className="space-y-6 pb-24 sm:pb-8 font-sans bg-[#F9FAFB] min-h-screen">

            {/* Premium Header */}
            <div className="bg-gradient-to-br from-[#10B981] to-[#059669] rounded-b-[32px] sm:rounded-2xl p-7 sm:p-10 text-white shadow-[0_10px_40px_rgba(16,185,129,0.2)] relative overflow-hidden -mx-4 -mt-4 sm:mx-0 sm:mt-0">
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-[20px] flex items-center justify-center border border-white/30">
                            <Lock className="w-7 h-7 text-emerald-50" />
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-50 bg-white/10 px-4 py-2 rounded-full border border-white/20 backdrop-blur-sm uppercase tracking-wider">
                            <Shield className="w-3.5 h-3.5" /> End-to-End Encrypted
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold font-playfair tracking-tight mb-3">My Secure Vault</h1>
                    <p className="text-emerald-50/80 max-w-sm text-[14px] leading-relaxed font-medium">
                        Your private repository for clinical documents, protected by clinical-grade encryption.
                    </p>
                </div>
                {/* Decorative flare */}
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            </div>

            <div className="px-1 sm:px-0">
                {/* Filter Chips - Refined */}
                <div className="flex overflow-x-auto pb-4 gap-2.5 snap-x hide-scrollbar mb-4 no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`snap-start shrink-0 px-6 py-2.5 rounded-full text-[13px] font-bold transition-all duration-300 border ${selectedCategory === cat
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20'
                                    : 'bg-white text-slate-500 border-slate-100 hover:border-emerald-200 hover:text-emerald-600'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Reports List - Premium Cards */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse bg-white rounded-[24px] h-36 border border-slate-100"></div>
                        ))}
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-white rounded-[28px] p-12 text-center border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col items-center mt-6">
                        <div className="h-20 w-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-5 border border-emerald-100 animate-in zoom-in duration-500">
                            <FileText className="h-10 w-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 font-playfair">Vault is Empty</h3>
                        <p className="text-slate-500 mt-2.5 max-w-xs text-[14px] font-medium leading-relaxed">No medical records found in this category yet.</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {reports.map((report) => (
                            <Card key={report._id} className="border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] transition-all duration-500 rounded-[24px] overflow-hidden group border-none">
                                <CardContent className="p-0">
                                    <div className="p-6 flex items-start gap-5 bg-white relative z-10 transition-colors group-hover:bg-slate-50/30">
                                        <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center shrink-0 border-2 ${report.category === 'blood' ? 'bg-rose-50 border-rose-100/50 text-rose-500' :
                                                report.category === 'imaging' ? 'bg-indigo-50 border-indigo-100/50 text-indigo-500' :
                                                    report.category === 'prescription' ? 'bg-blue-50 border-blue-100/50 text-blue-500' :
                                                        'bg-slate-50 border-slate-200/50 text-slate-500'
                                            }`}>
                                            {getCategoryIcon(report.category)}
                                        </div>
                                        <div className="flex-1 min-w-0 pt-1">
                                            <h4 className="font-bold text-slate-900 text-lg truncate pr-8 tracking-tight">{report.title}</h4>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                                    {report.category}
                                                </span>
                                                <span className="text-[12px] text-slate-400 font-semibold flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> {format(new Date(report.date || report.createdAt), 'MMM d, yyyy')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="absolute right-6 top-8 text-slate-300 group-hover:text-emerald-500 transition-all duration-300">
                                            <ChevronDown className="w-6 h-6" />
                                        </div>
                                    </div>

                                    {/* AI Summary Section */}
                                    <div className="px-6 pb-6 pt-0 bg-white">
                                        <div className="bg-slate-50 border border-slate-100/50 rounded-[20px] p-5 transition-all group-hover:bg-emerald-50/20 group-hover:border-emerald-100/30">
                                            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Activity className="w-3.5 h-3.5" /> AI Clinical Insights
                                            </p>
                                            <p className="text-[14px] text-slate-600 leading-relaxed font-medium">
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
