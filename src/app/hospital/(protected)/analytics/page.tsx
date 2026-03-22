"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, CheckCircle2, FileText, ArrowLeft, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AnalyticsPage() {
    const { toast } = useToast();
    const [performance, setPerformance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPerformance();
    }, []);

    const fetchPerformance = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/hospital/analytics/performance');
            if (res.ok) {
                const data = await res.json();
                setPerformance(data.performance || []);
            } else {
                toast({ variant: 'destructive', description: 'Failed to load analytics.' });
            }
        } catch (e) {
            toast({ variant: 'destructive', description: 'Network error.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => window.location.href = '/hospital/dashboard'}
                        className="text-slate-500 hover:text-white mb-2 -ml-2"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                    </Button>
                    <h2 className="text-4xl font-black text-white font-playfair tracking-tight">Performance Analytics</h2>
                    <p className="text-slate-400 font-medium">Monthly efficiency metrics for medical staff.</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[#02B69A]" />
                    <span className="text-sm font-bold text-white uppercase tracking-widest">{format(new Date(), 'MMMM yyyy')}</span>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse bg-slate-900 rounded-3xl h-32 border border-slate-800"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8">
                    {/* Performance Table */}
                    <Card className="bg-slate-950 border-slate-800 overflow-hidden shadow-2xl">
                        <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-white font-playfair uppercase tracking-widest text-sm">Doctor Performance Metrics</h3>
                            <TrendingUp className="w-5 h-5 text-[#02B69A]" />
                        </div>
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/30 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <th className="px-6 py-4">Doctor Name</th>
                                        <th className="px-6 py-4">Specialty</th>
                                        <th className="px-6 py-4 text-center">Appointments</th>
                                        <th className="px-6 py-4 text-center">Completed</th>
                                        <th className="px-6 py-4 text-center">Prescriptions</th>
                                        <th className="px-6 py-4 text-right">Success Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {performance.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-600 italic">No performance data available for this month.</td>
                                        </tr>
                                    ) : (
                                        performance.map((doc: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-900/40 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-[#02B69A]/10 text-[#02B69A] flex items-center justify-center font-bold font-playfair">
                                                            {doc.name.charAt(0)}
                                                        </div>
                                                        <span className="font-bold text-white group-hover:text-[#02B69A] transition-colors">{doc.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-sm font-medium text-slate-400">{doc.specialty || 'General'}</span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <div className="inline-flex items-center justify-center w-10 h-7 bg-slate-900 rounded-lg text-sm font-bold text-white">
                                                        {doc.appointmentsCount}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span>{doc.completedCount}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <div className="flex items-center justify-center gap-1.5 text-indigo-400 font-bold">
                                                        <FileText className="w-4 h-4" />
                                                        <span>{doc.prescriptionsCount}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className={`text-sm font-black ${doc.completionRate > 80 ? 'text-[#02B69A]' : doc.completionRate > 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                                                            {doc.completionRate}%
                                                        </span>
                                                        <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full transition-all duration-1000 ${doc.completionRate > 80 ? 'bg-[#02B69A]' : doc.completionRate > 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                                                style={{ width: `${doc.completionRate}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-slate-900 border-slate-800 p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#02B69A]/10 flex items-center justify-center">
                                    <Users className="w-6 h-6 text-[#02B69A]" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Doctors</p>
                                    <h4 className="text-2xl font-black text-white">{performance.length}</h4>
                                </div>
                            </div>
                        </Card>
                        <Card className="bg-slate-900 border-slate-800 p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Digital Prescriptions</p>
                                    <h4 className="text-2xl font-black text-white">
                                        {performance.reduce((acc, doc) => acc + doc.prescriptionsCount, 0)}
                                    </h4>
                                </div>
                            </div>
                        </Card>
                        <Card className="bg-slate-900 border-slate-800 p-6 border-l-4 border-l-[#02B69A]">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-[#02B69A]" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Completion</p>
                                    <h4 className="text-2xl font-black text-white">
                                        {performance.length > 0 
                                            ? Math.round(performance.reduce((acc, doc) => acc + doc.completionRate, 0) / performance.length)
                                            : 0}%
                                    </h4>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
