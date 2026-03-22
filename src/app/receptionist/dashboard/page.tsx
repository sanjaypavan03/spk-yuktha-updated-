"use client";

import { useEffect, useState } from "react";
import { 
    Calendar, 
    UserPlus, 
    QrCode, 
    Upload, 
    Activity, 
    Users, 
    Clock, 
    Plus, 
    ArrowRight 
} from "lucide-react";
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReceptionistDashboard() {
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({
        todayAppointments: 0,
        pendingScans: 0
    });
    const [recentAppointments, setRecentAppointments] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch profile
                const profileRes = await fetch('/api/receptionist/me');
                if (profileRes.ok) {
                    const data = await profileRes.json();
                    setUser(data.user);
                }

                // Fetch today's appointments
                const today = new Date().toISOString().split('T')[0];
                const apptsRes = await fetch(`/api/appointments?date=${today}`);
                if (apptsRes.ok) {
                    const data = await apptsRes.json();
                    setRecentAppointments(data.appointments.slice(0, 5));
                    setStats(prev => ({ ...prev, todayAppointments: data.appointments.length }));
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchData();
    }, []);

    const quickActions = [
        { label: "Register Patient", href: "/receptionist/register", icon: UserPlus, color: "bg-emerald-500" },
        { label: "Book Appointment", href: "/receptionist/appointments", icon: Plus, color: "bg-[#02B69A]" },
        { label: "Scan QR Code", href: "/receptionist/scan", icon: QrCode, color: "bg-indigo-500" },
        { label: "Upload Reports", href: "/receptionist/upload-report", icon: Upload, color: "bg-amber-500" },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header / Greeting */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-[10px] font-black text-[#02B69A] uppercase tracking-[0.2em] mb-2">Hospital Operations Portal</h2>
                    <h1 className="text-4xl md:text-5xl font-playfair font-black text-white italic tracking-tighter">
                        Good day, {user?.name?.split(' ')[0] || 'Receptionist'}
                    </h1>
                    <p className="text-slate-500 font-medium">Managing care at <span className="text-slate-300 font-bold">{user?.hospitalName}</span></p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Today's Visits</p>
                        <p className="text-2xl font-black text-white">{stats.todayAppointments}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, i) => (
                    <Link key={i} href={action.href}>
                        <Card className="bg-slate-900 border-slate-800 hover:border-[#02B69A]/50 transition-all group cursor-pointer h-full">
                            <CardContent className="p-6">
                                <div className={`${action.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <action.icon className="w-6 h-6 text-black stroke-[2.5px]" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">{action.label}</h3>
                                <p className="text-xs text-slate-500 font-medium flex items-center group-hover:text-white transition-colors">
                                    Open Portal <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Appointments */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-bold text-white font-playfair flex items-center gap-2">
                            <Activity className="w-5 h-5 text-[#02B69A]" /> Recent Appointments
                        </h3>
                        <Link href="/receptionist/appointments" className="text-[10px] font-black text-[#02B69A] uppercase tracking-widest hover:underline">
                            View All
                        </Link>
                    </div>
                    
                    <div className="space-y-3">
                        {recentAppointments.length === 0 ? (
                            <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl p-12 text-center">
                                <p className="text-slate-500 text-sm italic">No appointments scheduled for today yet.</p>
                            </div>
                        ) : (
                            recentAppointments.map((appt) => (
                                <Card key={appt._id} className="bg-slate-900 border-slate-800 hover:bg-slate-900/80 transition-all border-l-4 border-l-[#02B69A]">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-black rounded-xl flex flex-col items-center justify-center border border-slate-800 shrink-0">
                                            <Clock className="w-4 h-4 text-slate-500 mb-1" />
                                            <span className="text-[10px] font-bold text-white">{appt.timeSlot}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white truncate">{appt.patientId?.name}</p>
                                            <p className="text-xs text-slate-500">Dr. {appt.doctorId?.name}</p>
                                        </div>
                                        <div className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter ${
                                            appt.status === 'booked' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                                        }`}>
                                            {appt.status}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                {/* System Info / Guidance */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white font-playfair flex items-center gap-2 px-2">
                        <Users className="w-5 h-5 text-indigo-400" /> Operational Guidance
                    </h3>
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/20">
                                <QrCode className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm mb-1">Patient Check-in via QR</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">Ask patients to show their Digital Health QR. Scanning it automatically retrieves their profile and allows you to mark them for emergency priority.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 pt-6 border-t border-slate-800/50">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/20">
                                <UserPlus className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm mb-1">New Patient Registration</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">If a patient is new to Yuktha, use the Registration tool. This creates their global health profile and assigns them to this hospital.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
