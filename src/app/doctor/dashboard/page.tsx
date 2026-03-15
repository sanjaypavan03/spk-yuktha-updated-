"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, Clock, ChevronRight, Activity, Beaker, Pill } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function DoctorDashboardPage() {
    const router = useRouter();
    const [doctorUser, setDoctorUser] = useState<any>(null);
    const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
    const [stats, setStats] = useState({ todayCount: 0, patientsSeen: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Get doctor info
                const meRes = await fetch('/api/doctor/me');
                if (meRes.ok) {
                    const data = await meRes.json();
                    setDoctorUser(data.user);
                }

                // Get today's appointments
                const apptRes = await fetch('/api/appointments?date=today');
                if (apptRes.ok) {
                    const data = await apptRes.json();
                    setTodayAppointments(data.appointments || []);
                }

                // Get analytics (pseudo-endpoint or real if implemented)
                const analyticsRes = await fetch('/api/doctor/analytics');
                if (analyticsRes.ok) {
                    const data = await analyticsRes.json();
                    setStats({
                        todayCount: data.todayAppointments || 0,
                        patientsSeen: data.totalPatientsSeen || 0
                    });
                } else {
                    // Fallback using today's length
                    if (apptRes.ok) {
                        const data = await apptRes.json();
                        setStats(prev => ({ ...prev, todayCount: data.appointments?.length || 0 }));
                    }
                }
            } catch (error) {
                console.error("Dashboard error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-24 bg-slate-900 rounded-2xl border border-slate-800"></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 bg-slate-900 rounded-2xl border border-slate-800"></div>
                    <div className="h-32 bg-slate-900 rounded-2xl border border-slate-800"></div>
                </div>
            </div>
        );
    }

    const nextPatient = todayAppointments.find(a => a.status === 'scheduled');
    const completedCount = todayAppointments.filter(a => a.status === 'completed').length;

    return (
        <div className="space-y-6">

            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white font-playfair tracking-tight mb-1">
                        Welcome, Dr. {doctorUser?.name?.split(' ')[0] || 'Doctor'}
                    </h2>
                    <p className="text-slate-400 font-medium">
                        {format(new Date(), 'EEEE, MMMM do, yyyy')}
                    </p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">{doctorUser?.hospitalName || 'Yuktha Partner Hospital'}</p>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-slate-900 border-slate-800 shadow-none">
                    <CardContent className="p-5 sm:p-6">
                        <div className="w-10 h-10 bg-[#02B69A]/10 text-[#02B69A] rounded-xl flex items-center justify-center mb-4">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{stats.todayCount}</p>
                        <p className="text-xs sm:text-sm text-slate-400 font-medium">Today's Appointments</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-none">
                    <CardContent className="p-5 sm:p-6">
                        <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-4">
                            <Users className="w-5 h-5" />
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{stats.patientsSeen}</p>
                        <p className="text-xs sm:text-sm text-slate-400 font-medium">Total Patients Seen</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-none hidden sm:block">
                    <CardContent className="p-5 sm:p-6">
                        <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-4">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div className="flex items-end gap-2 mb-1">
                            <p className="text-3xl font-bold text-white">{completedCount}</p>
                            <p className="text-sm text-slate-500 pb-1">/ {stats.todayCount}</p>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-400 font-medium">Completed Today</p>
                    </CardContent>
                </Card>
            </div>

            {/* Next Patient Card */}
            <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white font-playfair tracking-wide">Next Up</h3>
                    <button
                        onClick={() => router.push('/doctor/appointments')}
                        className="text-sm font-semibold text-[#02B69A] hover:text-[#00D4AA] transition-colors"
                    >
                        View schedule &rarr;
                    </button>
                </div>

                {!nextPatient ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-slate-800 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8" />
                        </div>
                        <p className="text-slate-300 font-bold text-lg mb-1">No upcoming patients</p>
                        <p className="text-slate-500 text-sm">Your schedule for the rest of today is clear.</p>
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-[#02B69A]/20 to-slate-900 border border-[#02B69A]/30 rounded-2xl p-1 relative overflow-hidden group hover:border-[#02B69A]/50 transition-colors cursor-pointer" onClick={() => router.push('/doctor/appointments')}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#02B69A]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="bg-slate-950/80 backdrop-blur-xl rounded-xl p-5 sm:p-6 relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-slate-900 border border-slate-800 text-[#02B69A] rounded-2xl flex items-center justify-center shrink-0">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-xl font-bold text-white">{nextPatient.patientId?.name || 'Unknown Patient'}</p>
                                        <span className="bg-[#02B69A]/20 text-[#02B69A] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                            {nextPatient.timeSlot}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 font-medium text-sm line-clamp-1">{nextPatient.reason}</p>
                                </div>
                            </div>

                            <div className="w-full sm:w-auto flex items-center gap-2 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-800/50">
                                <button className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-[#02B69A] hover:bg-[#00D4AA] text-slate-950 font-bold px-4 py-2.5 rounded-lg transition-colors text-sm">
                                    Review Chart <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Quick Actions (Could add actual routes later) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Tools</h3>
                    <div className="space-y-3">
                        <button onClick={() => router.push('/doctor/patients')} className="w-full flex items-center justify-between p-4 bg-slate-950 border border-slate-800/50 hover:border-slate-700 hover:bg-slate-900 transition-colors rounded-xl group text-left">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><Beaker className="w-4 h-4" /></div>
                                <span className="font-semibold text-slate-300 group-hover:text-white transition-colors">Add Clinical Reading</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                        </button>
                        <button className="w-full flex items-center justify-between p-4 bg-slate-950 border border-slate-800/50 hover:border-slate-700 hover:bg-slate-900 transition-colors rounded-xl group text-left opacity-50 cursor-not-allowed">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg"><Pill className="w-4 h-4" /></div>
                                <span className="font-semibold text-slate-300">Draft Prescription <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-500 ml-2">Soon</span></span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
