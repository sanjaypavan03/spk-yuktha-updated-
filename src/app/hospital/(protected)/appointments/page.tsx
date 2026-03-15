"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, Clock, Search, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function HospitalAppointmentsPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const res = await fetch('/api/appointments');
                if (res.ok) {
                    const data = await res.json();
                    // Just show upcoming for simplicity in this admin view
                    const sorted = (data.appointments || []).sort((a: any, b: any) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    setAppointments(sorted);
                }
            } catch (error) {
                console.error("Failed to fetch hospital appointments", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    const filteredList = appointments.filter(a =>
        a.patientId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.reason?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white font-playfair tracking-tight mb-1">
                        Facility Appointments
                    </h2>
                    <p className="text-slate-400 font-medium text-sm">
                        View global hospital schedule.
                    </p>
                </div>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                    type="text"
                    placeholder="Search by patient name or reason..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#02B69A] transition-all"
                />
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-slate-900 rounded-2xl h-24 border border-slate-800"></div>
                    ))}
                </div>
            ) : filteredList.length === 0 ? (
                <div className="bg-slate-900/50 rounded-2xl p-12 text-center border border-slate-800 border-dashed">
                    <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-300 font-playfair">No Appointments</h3>
                    <p className="text-slate-500 mt-2 text-sm">No appointments matching your criteria.</p>
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {filteredList.map((appt) => (
                        <Card key={appt._id} className="bg-slate-900 border-slate-800 shadow-none hover:border-slate-700 transition-colors">
                            <CardContent className="p-5 flex items-start gap-4">
                                <div className="hidden sm:flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-xl p-3 shrink-0 min-w-[70px]">
                                    <span className="text-[#02B69A] font-bold text-lg leading-none">{format(new Date(appt.date), 'dd')}</span>
                                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{format(new Date(appt.date), 'MMM')}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-white text-lg truncate">{appt.patientId?.name || 'Unknown Patient'}</p>
                                            <p className="text-slate-400 text-sm line-clamp-1">{appt.reason}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md shrink-0 ml-2 ${appt.status === 'scheduled' ? 'bg-[#02B69A]/10 text-[#02B69A]' :
                                                appt.status === 'completed' ? 'bg-indigo-500/10 text-indigo-400' :
                                                    'bg-slate-800 text-slate-400'
                                            }`}>
                                            {appt.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-3">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            {appt.timeSlot}
                                        </div>
                                        {appt.doctorId && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                <User className="w-3.5 h-3.5" />
                                                Assigned Doc
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
