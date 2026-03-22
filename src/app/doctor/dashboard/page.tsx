"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
    Users, Calendar, Clock, ChevronRight, Activity, Beaker, Pill, 
    User as UserIcon, Plus, FileText, Bell, Check, Trash2, X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function DoctorDashboardPage() {
    const router = useRouter();
    const [doctorUser, setDoctorUser] = useState<any>(null);
    const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
    const [stats, setStats] = useState({ 
        todayCount: 0, 
        patientsSeen: 0, 
        prescriptionsThisMonth: 0, 
        avgAdherence: 0 
    });
    const [priorityPatients, setPriorityPatients] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Get doctor info
                const meRes = await fetch('/api/doctor/me');
                if (meRes.ok) {
                    const data = await meRes.json();
                    setDoctorUser(data.user);
                }

                // 2. Get today's appointments
                const apptRes = await fetch('/api/appointments?date=today');
                if (apptRes.ok) {
                    const data = await apptRes.json();
                    setTodayAppointments(data.appointments || []);
                }

                // 3. Get enhanced analytics
                const analyticsRes = await fetch('/api/doctor/analytics');
                if (analyticsRes.ok) {
                    const data = await analyticsRes.json();
                    if (data.success) {
                        setStats({
                            todayCount: data.data.appointmentsToday || 0,
                            patientsSeen: data.data.totalPatientsSeen || 0,
                            prescriptionsThisMonth: data.data.prescriptionsThisMonth || 0,
                            avgAdherence: data.data.avgAdherence || 0
                        });
                    }
                }

                // 4. Get Priority Patients
                const patientsRes = await fetch('/api/doctor/patients');
                if (patientsRes.ok) {
                    const data = await patientsRes.json();
                    if (data.success) {
                        const priority = (data.patients || []).filter((p: any) => 
                            p.conditionControlLevel === 'Uncontrolled' || 
                            p.conditionControlLevel === 'Poorly controlled'
                        );
                        setPriorityPatients(priority);
                    }
                }

                // 5. Get Notifications
                const notifRes = await fetch('/api/notifications');
                if (notifRes.ok) {
                    const data = await notifRes.json();
                    setNotifications(data.notifications || []);
                    setUnreadCount(data.unreadCount || 0);
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-slate-900 rounded-2xl border border-slate-800"></div>
                    ))}
                </div>
            </div>
        );
    }

    const nextPatient = todayAppointments.find(a => a.status === 'scheduled');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white font-playfair tracking-tight mb-1">
                        Welcome, Dr. {doctorUser?.name?.split(' ')[0] || 'Doctor'}
                    </h2>
                    <p className="text-slate-400 font-medium italic">
                        {format(new Date(), 'EEEE, MMMM do, yyyy')}
                    </p>
                </div>
                <div className="text-right flex items-center gap-6">
                    <div className="relative">
                        <button 
                            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                            className="relative p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-[#02B69A] hover:border-[#02B69A]/30 transition-all active:scale-95 shadow-xl"
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-slate-900 translate-x-1/3 -translate-y-1/3">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifDropdown && (
                            <div className="absolute top-full right-0 mt-4 w-80 bg-slate-900 border border-slate-800 rounded-[32px] shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Clinical Alerts</h4>
                                    {unreadCount > 0 && (
                                        <button 
                                            onClick={async () => {
                                                await fetch('/api/notifications', {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ allRead: true })
                                                });
                                                setUnreadCount(0);
                                                setNotifications(notifications.map(n => ({ ...n, isRead: true })));
                                            }}
                                            className="text-[10px] font-bold text-[#02B69A] hover:underline"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {notifications.length === 0 ? (
                                        <div className="p-10 text-center">
                                            <p className="text-slate-600 text-[11px] font-bold uppercase tracking-widest">No recent alerts</p>
                                        </div>
                                    ) : (
                                        notifications.map((n) => (
                                            <div 
                                                key={n._id} 
                                                onClick={async () => {
                                                    if (!n.isRead) {
                                                        await fetch('/api/notifications', {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ notificationId: n._id })
                                                        });
                                                        setUnreadCount(prev => Math.max(0, prev - 1));
                                                        setNotifications(notifications.map(notif => notif._id === n._id ? { ...notif, isRead: true } : notif));
                                                    }
                                                    if (n.type === 'report_upload' && n.relatedId) {
                                                        // Find patient ID? The message often contains info. 
                                                        // For now, if we have relatedId (Report ID), we might need to fetch report to get patientId.
                                                        // Ideally notification payload should have relatedPatientId.
                                                        // For now, let's just close dropdown.
                                                        setShowNotifDropdown(false);
                                                    }
                                                }}
                                                className={`p-5 border-b border-slate-800/50 cursor-pointer transition-colors ${n.isRead ? 'opacity-60 grayscale-[0.5]' : 'bg-[#02B69A]/5 hover:bg-[#02B69A]/10'}`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${n.type === 'report_upload' ? 'text-teal-500' : 'text-slate-400'}`}>
                                                        {n.type.replace('_', ' ')}
                                                    </p>
                                                    <span className="text-[9px] text-slate-600 font-bold">{format(new Date(n.createdAt), 'MMM d, h:mm a')}</span>
                                                </div>
                                                <p className="text-slate-300 text-[13px] leading-relaxed font-medium">{n.message}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                            {doctorUser?.hospitalName || 'Yuktha Partner Hospital'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-slate-900 border-slate-800 shadow-none">
                    <CardContent className="p-5 sm:p-6">
                        <div className="w-10 h-10 bg-[#02B69A]/10 text-[#02B69A] rounded-xl flex items-center justify-center mb-4 border border-[#02B69A]/20">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{stats.todayCount}</p>
                        <p className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-wider">Today's Visits</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-none">
                    <CardContent className="p-5 sm:p-6">
                        <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-4 border border-indigo-500/20">
                            <Users className="w-5 h-5" />
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{stats.patientsSeen}</p>
                        <p className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-wider">Total Patients</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-none">
                    <CardContent className="p-5 sm:p-6">
                        <div className="w-10 h-10 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center mb-4 border border-rose-500/20">
                            <Pill className="w-5 h-5" />
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{stats.prescriptionsThisMonth}</p>
                        <p className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-wider">RCs Issued (MTD)</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-none">
                    <CardContent className="p-5 sm:p-6">
                        <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mb-4 border border-amber-500/20">
                            <Activity className="w-5 h-5" />
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{stats.avgAdherence}%</p>
                        <p className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-wider">Avg Adherence</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white font-playfair tracking-tight">Next Patient</h3>
                            <button
                                onClick={() => router.push('/doctor/appointments')}
                                className="text-sm font-bold text-[#02B69A] hover:text-[#00D4AA] transition-colors flex items-center gap-1"
                            >
                                Schedule <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {!nextPatient ? (
                            <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-[32px] p-12 text-center">
                                <div className="w-16 h-16 bg-slate-800/50 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-8 h-8" />
                                </div>
                                <p className="text-slate-400 font-bold mb-1">No upcoming patients</p>
                                <p className="text-slate-600 text-[13px]">Your schedule for today is complete.</p>
                            </div>
                        ) : (
                            <div 
                                onClick={() => router.push(`/doctor/patients/${nextPatient.patientId?._id}`)}
                                className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-8 rounded-[32px] group cursor-pointer hover:border-[#02B69A]/30 transition-all relative overflow-hidden shadow-2xl"
                            >
                                <div className="absolute top-0 right-0 w-48 h-48 bg-[#02B69A]/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-[#02B69A]/10 transition-colors"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-800 border-2 border-slate-700/50 rounded-2xl flex items-center justify-center group-hover:border-[#02B69A]/50 transition-colors">
                                                <UserIcon className="w-8 h-8 text-slate-300 group-hover:text-[#02B69A] transition-colors" />
                                            </div>
                                            <div>
                                                <h4 className="text-2xl font-bold text-white mb-1">{nextPatient.patientId?.name}</h4>
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-[#02B69A]/10 text-[#02B69A] text-[10px] font-black px-2.5 py-1 rounded-md border border-[#02B69A]/20 uppercase tracking-widest">{nextPatient.timeSlot}</span>
                                                    <span className="text-slate-500 font-mono text-xs">{nextPatient.patientId?._id?.toString().slice(-6).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-800 rounded-xl text-[#02B69A] shadow-inner">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="bg-slate-950/50 border border-slate-800/50 p-5 rounded-2xl mb-6">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Complaint / Reason</p>
                                        <p className="text-slate-300 font-medium italic">"{nextPatient.reason}"</p>
                                    </div>
                                    <button className="w-full flex items-center justify-center gap-2 bg-[#02B69A] hover:bg-[#00D4AA] text-slate-950 font-black py-4 rounded-2xl transition-all shadow-lg shadow-[#02B69A]/10 uppercase tracking-widest text-sm">
                                        Open Patient Profile <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white font-playfair tracking-wide flex items-center gap-2">
                             Priority Patients
                        </h3>
                        <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-1 rounded tracking-widest uppercase">Unstable</span>
                    </div>

                    <div className="space-y-3">
                        {priorityPatients.length === 0 ? (
                            <div className="p-8 border border-slate-800/50 border-dashed rounded-2xl text-center">
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">All patients stable</p>
                            </div>
                        ) : (
                            priorityPatients.map(patient => (
                                <Card key={patient.patientId?._id} onClick={() => router.push(`/doctor/patients/${patient.patientId?._id}`)} className="bg-slate-900 border-rose-500/20 hover:border-rose-500/50 transition-colors shadow-none rounded-2xl cursor-pointer">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center shrink-0 border border-rose-500/20">
                                                <Activity className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-white truncate">{patient.patientId?.name}</p>
                                                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">{patient.conditionControlLevel}</p>
                                            </div>
                                            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}

                        <button onClick={() => router.push('/doctor/patients')} className="w-full py-4 text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em] bg-slate-950 rounded-2xl border border-slate-900 hover:border-slate-800">
                            View All Patients
                        </button>
                    </div>

                    <div className="p-6 bg-[#02B69A]/5 border border-[#02B69A]/10 rounded-3xl mt-8">
                        <h4 className="text-[10px] font-black text-[#02B69A] uppercase tracking-widest mb-4">Quick Tools</h4>
                        <div className="space-y-2">
                             <button onClick={() => router.push('/doctor/patients')} className="w-full flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded-xl hover:bg-slate-900 transition-colors group">
                                <span className="text-[13px] font-bold text-slate-400 group-hover:text-white">New Clinical Entry</span>
                                <Plus className="w-4 h-4 text-[#02B69A]" />
                             </button>
                             <button className="w-full flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded-xl opacity-40 cursor-not-allowed">
                                <span className="text-[13px] font-bold text-slate-400">Draft IP Note</span>
                                <FileText className="w-4 h-4 text-slate-600" />
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
