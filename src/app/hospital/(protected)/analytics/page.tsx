"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, Pill, AlertTriangle, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function HospitalAnalyticsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/hospital/analytics');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-10 bg-slate-900 rounded-lg w-1/4"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-900 rounded-2xl"></div>)}
                </div>
                <div className="h-64 bg-slate-900 rounded-2xl"></div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-white font-playfair tracking-tight mb-1">
                    Hospital Analytics
                </h2>
                <p className="text-slate-400 font-medium text-sm">
                    Overview of your facility's performance, patient intake, and prescription volume.
                </p>
            </div>

            {/* Core Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-slate-900 border-slate-800 shadow-none">
                    <CardContent className="p-5">
                        <div className="w-10 h-10 bg-[#02B69A]/10 text-[#02B69A] rounded-xl flex items-center justify-center mb-4">
                            <Users className="w-5 h-5" />
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{stats.totalPatients || 0}</p>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Unique Patients</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-none">
                    <CardContent className="p-5">
                        <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-4">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{stats.appointmentsThisMonth || 0}</p>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Visits (Month)</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-none">
                    <CardContent className="p-5">
                        <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-4">
                            <Pill className="w-5 h-5" />
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{stats.totalPrescriptions || 0}</p>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Prescriptions</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-none">
                    <CardContent className="p-5">
                        <div className="w-10 h-10 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center mb-4">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="flex items-end gap-2 mb-1">
                            <p className="text-3xl font-bold text-white">{stats.noShowRate || 0}%</p>
                        </div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">No-Show Rate</p>
                    </CardContent>
                </Card>
            </div>

            {/* Chart Area */}
            <Card className="bg-slate-900 border-slate-800 shadow-none">
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-6 text-white font-bold font-playfair tracking-wide text-lg">
                        <TrendingUp className="w-5 h-5 text-[#02B69A]" /> Prescriptions (Last 7 Days)
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.prescriptionsLast7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#02B69A" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#02B69A" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#02B69A' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#02B69A"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <p className="text-center text-slate-500 text-xs mt-4">
                Metrics are aggregated securely and anonymized per hospital tenant.
            </p>
        </div>
    );
}
