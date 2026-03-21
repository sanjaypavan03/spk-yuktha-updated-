"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Clock, Hospital, FileText, ChevronRight } from "lucide-react";
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { PremiumSelect } from '@/components/ui/premium-select';

export default function AppointmentsPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Booking Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [selectedHospital, setSelectedHospital] = useState('');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [reason, setReason] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [slotsLoading, setSlotsLoading] = useState(false);

    const fetchAppointments = async () => {
        try {
            const res = await fetch('/api/appointments');
            if (res.ok) {
                const data = await res.json();
                setAppointments(data.appointments || []);
            }
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHospitals = async () => {
        try {
            const res = await fetch('/api/hospitals');
            if (res.ok) {
                const data = await res.json();
                setHospitals(data.hospitals || []);
            }
        } catch (error) {
            console.error('Failed to fetch hospitals:', error);
        }
    };

    const fetchSlots = async (hospitalId: string, date: string) => {
        if (!hospitalId || !date) return;
        setSlotsLoading(true);
        try {
            const res = await fetch(`/api/appointments/slots?hospitalId=${hospitalId}&date=${date}`);
            if (res.ok) {
                const data = await res.json();
                setAvailableSlots(data.available || []);
                setSelectedSlot(''); // Reset slot on new search
            }
        } catch (error) {
            console.error('Failed to fetch slots:', error);
        } finally {
            setSlotsLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
        fetchHospitals();
    }, []);

    useEffect(() => {
        if (selectedHospital && selectedDate) {
            fetchSlots(selectedHospital, selectedDate);
        } else {
            setAvailableSlots([]);
        }
    }, [selectedHospital, selectedDate]);

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHospital || !selectedDate || !selectedSlot || !reason) {
            toast({ variant: 'destructive', description: 'Please fill all fields' });
            return;
        }

        setBookingLoading(true);
        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hospitalId: selectedHospital,
                    date: selectedDate,
                    timeSlot: selectedSlot,
                    reason
                })
            });

            if (res.ok) {
                toast({ title: 'Success', description: 'Appointment booked successfully!' });
                setIsDialogOpen(false);
                setSelectedHospital('');
                setSelectedDate('');
                setSelectedSlot('');
                setReason('');
                fetchAppointments(); // Refresh list
            } else {
                const errData = await res.json();
                toast({ variant: 'destructive', description: errData.error || 'Failed to book' });
            }
        } catch (error) {
            toast({ variant: 'destructive', description: 'Internal error occurred' });
        } finally {
            setBookingLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            case 'no_show': return 'bg-orange-100 text-orange-700';
            default: return 'bg-blue-100 text-blue-700';
        }
    };

    return (
        <div className="space-y-6 pb-24 sm:pb-8 font-sans bg-[#F8FAFC] min-h-screen p-4 sm:p-8 lg:p-12">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold font-playfair tracking-tight text-slate-800">Your Appointments</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#02B69A] hover:bg-[#018A75] text-white shadow-[0_4px_14px_rgba(2,182,154,0.39)] rounded-xl font-semibold px-6 transition-all duration-200">
                            Book Visit
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[94%] sm:max-w-[400px] rounded-2xl p-0 overflow-hidden bg-white border-none shadow-2xl">
                        <div className="bg-[#02B69A] p-3.5 text-white pb-3 z-0 relative">
                            <DialogTitle className="text-base font-playfair font-bold">Book Appointment</DialogTitle>
                            <p className="text-emerald-50 text-[10px] mt-0.5 opacity-80">Schedule a visit at a Yuktha hospital.</p>
                        </div>

                        <form onSubmit={handleBook} className="p-3.5 -mt-3 bg-white rounded-t-xl relative z-10 space-y-2.5">
                                <PremiumSelect
                                    label="Select Hospital"
                                    value={selectedHospital}
                                    onChange={setSelectedHospital}
                                    options={hospitals.map(h => ({ value: h._id, label: h.name }))}
                                    icon={Hospital}
                                    searchable={true}
                                />

                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Select Date</label>
                                <input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]} // Cannot book past
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#02B69A] text-slate-700 text-sm"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    required
                                />
                            </div>

                            {selectedHospital && selectedDate && (
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Available Slots</label>
                                    {slotsLoading ? (
                                        <p className="text-sm text-slate-500 italic ml-1">Finding slots...</p>
                                    ) : availableSlots.length === 0 ? (
                                        <p className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100">No slots available for this date.</p>
                                    ) : (
                                        <div className="grid grid-cols-4 gap-1.5 max-h-24 overflow-y-auto pr-1">
                                            {availableSlots.map(slot => (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    disabled={slot === selectedSlot ? false : undefined} // Keep simple disabled not needed for toggle
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`py-1.5 text-[11px] rounded-lg border transition-colors font-semibold ${selectedSlot === slot
                                                            ? 'bg-[#02B69A] text-white border-[#02B69A] shadow-md'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:border-[#02B69A] hover:bg-emerald-50'
                                                        }`}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Reason for Visit</label>
                                <textarea
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#02B69A] text-[#111] text-xs resize-none h-12"
                                    placeholder="e.g. Regular checkup, fever, etc."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                ></textarea>
                            </div>

                            <Button
                                type="submit"
                                disabled={bookingLoading}
                                className="w-full py-3.5 mt-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                            >
                                {bookingLoading ? 'Confirming...' : 'Confirm Booking'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-white rounded-2xl h-32 border border-slate-100"></div>
                    ))}
                </div>
            ) : appointments.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-sm flex flex-col items-center">
                    <div className="h-16 w-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                        <CalendarIcon className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 font-playfair">No Appointments</h3>
                    <p className="text-slate-500 mt-2 max-w-sm">You haven't booked any medical visits yet. Tap 'Book Visit' to schedule one.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.map((appt) => (
                        <Card key={appt._id} className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden group">
                            <CardContent className="p-0 flex flex-col sm:flex-row">
                                <div className="p-5 sm:w-1/3 bg-slate-50 flex flex-col justify-center sm:border-r border-slate-100 group-hover:bg-[#02B69A]/5 transition-colors">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CalendarIcon className="h-4 w-4 text-[#02B69A]" />
                                        <span className="font-bold text-slate-700">
                                            {format(new Date(appt.date), 'MMM do, yyyy')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-slate-400" />
                                        <span className="font-semibold text-slate-500 text-sm">{appt.timeSlot}</span>
                                    </div>
                                    <div className={`mt-3 self-start px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(appt.status)}`}>
                                        {appt.status.replace('_', ' ')}
                                    </div>
                                </div>
                                <div className="p-5 sm:w-2/3 bg-white flex flex-col justify-center relative">
                                    <h4 className="font-bold text-lg text-slate-800 mb-1">{appt.reason}</h4>

                                    <div className="flex items-center gap-2 mt-2">
                                        <Hospital className="h-4 w-4 text-slate-400" />
                                        <span className="text-sm font-medium text-slate-600">
                                            {appt.hospitalId?.name || 'Unknown Hospital'}
                                        </span>
                                    </div>

                                    {appt.doctorId && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <FileText className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm text-slate-500">
                                                Dr. {appt.doctorId?.name} <span className="text-xs opacity-70">({appt.doctorId?.specialty})</span>
                                            </span>
                                        </div>
                                    )}

                                    <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-hover:text-[#02B69A] transition-colors sm:hidden" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
