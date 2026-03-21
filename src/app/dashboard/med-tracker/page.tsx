"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, Plus, Check, Clock, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Link from 'next/link';

interface Medicine {
    _id?: string;
    name: string;
    medicineName?: string;
    dosage: string;
    frequency: string;
    time: string;
    taken: boolean;
    skipped?: boolean;
    notes?: string;
}

export default function MedTrackerPage() {
    const { toast } = useToast();
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [history, setHistory] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMed, setNewMed] = useState<{
        name: string;
        dosage: string;
        frequency: string;
        times: string[];
        notes: string;
    }>({ name: '', dosage: '', frequency: 'Once daily', times: ['08:00 AM'], notes: '' });

    const PRESET_TIMES = [
        { label: 'Morning', time: '08:00 AM', icon: '☀️' },
        { label: 'Afternoon', time: '01:00 PM', icon: '🌤️' },
        { label: 'Evening', time: '07:00 PM', icon: '🌆' },
        { label: 'Night', time: '10:00 PM', icon: '🌙' },
    ];

    useEffect(() => {
        fetchMedicines();
        fetchHistory();
    }, []);

    const fetchMedicines = async () => {
        try {
            const res = await fetch('/api/medicines');
            if (res.ok) {
                const json = await res.json();
                setMedicines(json.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch meds:", error);
            toast({ variant: 'destructive', description: 'Could not load your medications.' });
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/patient/pills/history');
            if (res.ok) {
                const data = await res.json();
                setHistory(data.history || {});
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        }
    };

    const handleAddMedicine = async () => {
        if (!newMed.name || !newMed.dosage || newMed.times.length === 0) {
            toast({ variant: 'destructive', description: 'Name, dosage, and at least one time are required.' });
            return;
        }

        try {
            const res = await fetch('/api/medicines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newMed.name,
                    dosage: newMed.dosage,
                    times: newMed.times,
                    frequency: newMed.frequency,
                    instructions: newMed.notes
                })
            });

            if (res.ok) {
                toast({ title: 'Medicine Saved', description: `${newMed.name} has been added and scheduled.` });
                setNewMed({ name: '', dosage: '', frequency: 'Once daily', times: ['08:00 AM'], notes: '' });
                setShowAddForm(false);
                fetchMedicines();
            } else {
                const data = await res.json();
                toast({ variant: 'destructive', description: data.error || 'Failed to save medication.' });
            }
        } catch (error) {
            console.error("Save error:", error);
            toast({ variant: 'destructive', description: 'Internal error while saving.' });
        }
    };

    const toggleTimeInSchedule = (time: string) => {
        if (newMed.times.includes(time)) {
            setNewMed(prev => ({ ...prev, times: prev.times.filter(t => t !== time) }));
        } else {
            setNewMed(prev => ({ ...prev, times: [...prev.times, time] }));
        }
    };

    const toggleTaken = async (id: string, status: { taken?: boolean, skipped?: boolean } = { taken: true }) => {
        const med = medicines.find(m => m._id === id);
        if (!med) return;

        setMedicines(medicines.map(m => m._id === id ? { ...m, ...status } : m));

        try {
            const res = await fetch(`/api/patient/pills/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(status)
            });
            if (res.ok) {
                fetchMedicines();
                fetchHistory();
            } else {
                throw new Error("API failed");
            }
        } catch (error) {
            console.error("Toggle error:", error);
            toast({ variant: 'destructive', description: "Failed to update status." });
            fetchMedicines();
        }
    };

    const removeMedicine = async (medId: string) => {
        const med = medicines.find(m => m._id === medId);
        if (!med) return;

        if (!window.confirm(`Stop taking ${med.medicineName || med.name} entirely? This will remove it from your schedule.`)) return;

        try {
            const res = await fetch(`/api/medicines/${medId}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: 'Medication Removed', description: `${med.medicineName || med.name} has been removed from your list.` });
                fetchMedicines();
            } else {
                const errorData = await res.json();
                toast({ variant: 'destructive', title: 'Deletion Failed', description: errorData.error || 'Could not delete medication.' });
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast({ variant: 'destructive', description: 'Network error or server unavailable.' });
        }
    };

    const totalCount = medicines.length;

    const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium";

    const formatDateHeader = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Today's History";
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
        return format(date, 'EEEE, MMM do');
    };

    return (
        <div className="space-y-6 pb-24 sm:pb-8 bg-[#F9FAFB] min-h-screen font-sans">
            <div className="bg-gradient-to-br from-[#10B981] to-[#059669] text-white rounded-b-[32px] sm:rounded-2xl p-7 sm:p-10 -mx-4 -mt-4 sm:mx-0 sm:mt-0 relative overflow-hidden shadow-[0_10px_40px_rgba(16,185,129,0.2)]">
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <h1 className="text-3xl font-bold font-playfair tracking-tight mb-2">Med Tracker</h1>
                        <p className="text-emerald-50 text-[14px] font-bold uppercase tracking-wider opacity-80">{format(new Date(), 'EEEE, MMMM do')}</p>
                    </div>
                    <Button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-xl px-5 h-11 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4 mr-2" strokeWidth={3} /> <span className="font-bold text-[14px]">Add Pill</span>
                    </Button>
                </div>
            </div>

            {showAddForm && (
                <div className="px-1 sm:px-0">
                    <Card className="border-emerald-100 shadow-[0_15px_40px_rgba(0,0,0,0.08)] animate-in zoom-in-95 duration-300 rounded-[24px] overflow-hidden">
                        <CardContent className="p-6 space-y-5">
                            <div className="flex justify-between items-center pb-2">
                                <h3 className="font-bold text-lg text-slate-800 font-playfair">Add New Medication</h3>
                                <Button size="icon" variant="ghost" onClick={() => setShowAddForm(false)} className="rounded-full hover:bg-slate-50">
                                    <X className="w-5 h-5 text-slate-400" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Medicine Name</label>
                                    <input type="text" value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} placeholder="e.g. Paracetamol" className={inputClass} />
                                </div>
                                
                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Dosage</label>
                                    <input type="text" value={newMed.dosage} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })} placeholder="e.g. 500mg" className={inputClass} />
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block px-1">Schedule (Tap to select multiple)</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {PRESET_TIMES.map((slot) => (
                                            <button
                                                key={slot.time}
                                                type="button"
                                                onClick={() => toggleTimeInSchedule(slot.time)}
                                                className={`py-3 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${newMed.times.includes(slot.time) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                                            >
                                                <span className="text-base">{slot.icon}</span>
                                                <span className={`text-[10px] font-bold ${newMed.times.includes(slot.time) ? 'text-emerald-700' : 'text-slate-600'}`}>{slot.label}</span>
                                                <span className="text-[8px] text-slate-400 font-bold">{slot.time}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Notes (optional)</label>
                                    <input type="text" value={newMed.notes} onChange={e => setNewMed({ ...newMed, notes: e.target.value })} placeholder="e.g. Take after breakfast" className={inputClass} />
                                </div>
                            </div>

                            <Button onClick={handleAddMedicine} className="w-full h-14 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all">
                                <Plus className="w-5 h-5 mr-2" strokeWidth={3} /> Save Medication
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* My Medications List */}
            <div className="px-1 space-y-4">
                <div className="flex items-center justify-between px-3 mb-4">
                    <h2 className="text-[18px] font-bold text-slate-800 font-playfair tracking-tight">Your Medications</h2>
                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[12px] font-bold">
                        {medicines.length} Total
                    </span>
                </div>
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => <div key={i} className="animate-pulse bg-white rounded-[24px] h-24 border border-slate-100"></div>)}
                    </div>
                ) : medicines.length === 0 ? (
                    <div className="bg-white rounded-[28px] p-10 text-center border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] group">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 transition-all group-hover:scale-110">
                            <Pill className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No Medications Added</h3>
                        <p className="text-slate-500 text-[13px] font-medium mt-1">Start by adding your first pill tracker.</p>
                    </div>
                ) : (
                    medicines.map((med) => (
                        <div key={med._id} className="group bg-white rounded-[24px] p-5 flex items-center gap-5 border border-slate-50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300">
                            <div className="h-14 w-14 rounded-[18px] flex items-center justify-center shrink-0 bg-slate-50 border border-slate-100 text-slate-400">
                                <Pill className="w-6 h-6" strokeWidth={2.2} />
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <p className="font-bold text-lg leading-tight text-slate-900">{(med as any).medicineName || med.name || 'Medication'}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5 overflow-hidden">
                                    <span className="text-[12px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wide">{med.dosage}</span>
                                    {(med as any).times?.map((t: string) => (
                                        <span key={t} className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0"><Clock className="w-3 h-3" /> {t}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-2 relative z-10 shrink-0">
                                <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors" onClick={() => removeMedicine(med._id!)}>
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Medical History Section */}
            <div className="px-1">
                <h2 className="text-[18px] font-bold text-slate-800 font-playfair tracking-tight px-3 mt-8 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-400" /> Medical History
                </h2>
                {Object.keys(history).filter(date => date !== new Date().toISOString().split('T')[0]).length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-10 font-medium">No past history recorded yet.</p>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(history)
                            .filter(([date]) => date !== new Date().toISOString().split('T')[0])
                            .map(([date, items]) => (
                            <div key={date}>
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-3">{formatDateHeader(date)}</h3>
                                <div className="space-y-3">
                                    {items.map((item: any) => (
                                        <div key={item._id} className="bg-slate-50/50 rounded-[20px] p-4 flex items-center gap-4 border border-slate-100/50 transition-all hover:bg-white hover:shadow-sm">
                                            <div className={`h-10 w-10 rounded-[12px] flex items-center justify-center shrink-0 ${item.taken ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                                {item.taken ? <Check className="w-5 h-5" strokeWidth={3} /> : <X className="w-5 h-5" strokeWidth={3} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-[14px] text-slate-700">{item.medicineName}</p>
                                                <p className="text-[12px] text-slate-400 font-medium">{item.scheduledTime} • {item.taken ? 'Taken' : 'Skipped'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx global>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}