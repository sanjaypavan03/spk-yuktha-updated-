"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, User, CheckCircle, Search, XCircle, MapPin } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function DoctorAppointmentsPage() {
    const { toast } = useToast();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming'); // 'all', 'today', 'upcoming'
    const [searchQuery, setSearchQuery] = useState('');

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            // Using existing API that returns role-appropriate appointments
            const res = await fetch('/api/appointments');
            if (res.ok) {
                const data = await res.json();
                setAppointments(data.appointments || []);
            }
        } catch (error) {
            console.error("Failed to fetch doctor appointments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/appointments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                toast({ title: 'Success', description: `Appointment marked as ${status}` });
                fetchAppointments();
            } else {
                toast({ variant: 'destructive', description: 'Failed to update status' });
            }
        } catch (error) {
            toast({ variant: 'destructive', description: 'Network error occurred' });
        }
    };

    // Filter Logic
    const todayStr = new Date().toISOString().split('T')[0];

    let filteredList = appointments;
    if (filter === 'today') {
        filteredList = appointments.filter(a => a.date.startsWith(todayStr));
    } else if (filter === 'upcoming') {
        filteredList = appointments.filter(a => a.date >= todayStr && a.status === 'scheduled');
    }

    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filteredList = filteredList.filter(a =>
            a.patientId?.name?.toLowerCase().includes(q) ||
            a.reason?.toLowerCase().includes(q)
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white font-playfair tracking-tight mb-1">
                        Appointments
                    </h2>
                    <p className="text-slate-400 font-medium text-sm">
                        Manage your patient visits and schedule.
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search patient or reason..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#02B69A] transition-all"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl shrink-0">
                    {['today', 'upcoming', 'all'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-colors ${filter === f ? 'bg-[#02B69A] text-slate-950' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-slate-900 rounded-2xl h-32 border border-slate-800"></div>
                    ))}
                </div>
            ) : filteredList.length === 0 ? (
                <div className="bg-slate-900/50 rounded-2xl p-12 text-center border border-slate-800 border-dashed">
                    <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-300 font-playfair">No Appointments Found</h3>
                    <p className="text-slate-500 mt-2 text-sm">Try adjusting your filters or search query.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredList.map((appt) => (
                        <Card key={appt._id} className="bg-slate-900 border-slate-800 shadow-none hover:border-slate-700 transition-colors">
                            <CardContent className="p-5 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center shrink-0">
                                            <User className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white leading-tight">{appt.patientId?.name || 'Unknown Patient'}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{appt.patientId?._id?.toString()?.slice(-6) || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ${appt.status === 'scheduled' ? 'bg-[#02B69A]/10 text-[#02B69A] border border-[#02B69A]/20' :
                                            appt.status === 'completed' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                                'bg-slate-800 text-slate-400 text-slate-800'
                                        }`}>
                                        {appt.status}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                                    <span className="text-sm font-medium text-slate-300">
                                        {format(new Date(appt.date), 'MMM do, yyyy')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mb-4 cursor-help" title="Hospital / Location">
                                    <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                                    <span className="text-sm text-slate-400 truncate">
                                        {appt.hospitalId?.name || 'Yuktha Clinic'}
                                    </span>
                                </div>

                                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 mb-4 flex-1">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Reason for Visit</p>
                                    <p className="text-sm text-slate-300 line-clamp-2">{appt.reason}</p>
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-auto">
                                    <div className="flex items-center gap-2 font-bold text-white bg-slate-800 px-3 py-1.5 rounded-lg">
                                        <Clock className="w-4 h-4 text-[#02B69A]" />
                                        {appt.timeSlot}
                                    </div>

                                    {appt.status === 'scheduled' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUpdateStatus(appt._id, 'cancelled')}
                                                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                                                title="Cancel"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(appt._id, 'completed')}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-[#02B69A]/10 text-[#02B69A] hover:bg-[#02B69A]/20 hover:text-white border border-[#02B69A]/30 rounded-lg font-semibold text-sm transition-colors"
                                            >
                                                <CheckCircle className="w-4 h-4" /> Complete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
