"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, Plus, Check, Clock, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Medicine {
    _id?: string;
    name: string;
    dosage: string;
    frequency: string;
    time: string;
    taken: boolean;
    notes?: string;
}

export default function MedTrackerPage() {
    const { toast } = useToast();
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    // Add form state
    const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: 'Once daily', time: '08:00', notes: '' });

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            const res = await fetch('/api/patient/pills/today');
            if (res.ok) {
                const data = await res.json();
                setMedicines(data.pills || []);
            }
        } catch (error) {
            console.error("Failed to fetch meds:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMedicine = () => {
        if (!newMed.name || !newMed.dosage) {
            toast({ variant: 'destructive', description: 'Medicine name and dosage are required.' });
            return;
        }

        const med: Medicine = {
            _id: Date.now().toString(),
            name: newMed.name,
            dosage: newMed.dosage,
            frequency: newMed.frequency,
            time: newMed.time,
            taken: false,
            notes: newMed.notes,
        };

        setMedicines([...medicines, med]);
        setNewMed({ name: '', dosage: '', frequency: 'Once daily', time: '08:00', notes: '' });
        setShowAddForm(false);
        toast({ title: 'Medicine Added', description: `${med.name} has been added to your tracker.` });
    };

    const toggleTaken = (id: string) => {
        setMedicines(medicines.map(m => m._id === id ? { ...m, taken: !m.taken } : m));
    };

    const removeMedicine = (id: string) => {
        setMedicines(medicines.filter(m => m._id !== id));
    };

    const takenCount = medicines.filter(m => m.taken).length;
    const totalCount = medicines.length;
    const adherencePercent = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

    const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium";

    return (
        <div className="space-y-6 pb-24 sm:pb-8 bg-[#F9FAFB] min-h-screen font-sans">
            {/* Premium Header */}
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

                {/* Adherence Insight */}
                {totalCount > 0 && (
                    <div className="flex items-center gap-6 mt-8 relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="relative w-20 h-20">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="16" fill="none" className="stroke-white/20" strokeWidth="4" />
                                <circle cx="18" cy="18" r="16" fill="none" className="stroke-white" strokeWidth="4" strokeDasharray={`${adherencePercent}, 100`} strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">{adherencePercent}%</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[15px] font-bold">{takenCount} of {totalCount} medications taken</p>
                            <p className="text-[13px] text-emerald-50 font-medium opacity-90 leading-snug">
                                {adherencePercent === 100 ? "Perfect adherence today! Proud of you. 🎉" : adherencePercent >= 50 ? "Doing great! Keep the momentum." : "Just a few more to stay consistent."}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Medicine Form - Refined */}
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block px-1">Medicine Name</label>
                                    <input type="text" value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} placeholder="e.g. Paracetamol" className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block px-1">Dosage</label>
                                    <input type="text" value={newMed.dosage} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })} placeholder="e.g. 500mg" className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block px-1">Time</label>
                                    <input type="time" value={newMed.time} onChange={e => setNewMed({ ...newMed, time: e.target.value })} className={inputClass} />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block px-1">Notes (optional)</label>
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

            {/* Medicine List - Premium Cards */}
            <div className="px-1 space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-white rounded-[24px] h-24 border border-slate-100"></div>)}
                    </div>
                ) : medicines.length === 0 ? (
                    <div className="bg-white rounded-[28px] p-12 text-center border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mt-6 group">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 transition-all group-hover:scale-110">
                            <Pill className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 font-playfair">No Medications</h3>
                        <p className="text-slate-500 text-[14px] font-medium mt-2 max-w-[220px] mx-auto leading-relaxed">Start your wellness journey by adding your first pill tracker.</p>
                    </div>
                ) : (
                    medicines.map((med) => (
                        <div
                            key={med._id}
                            className={`group bg-white rounded-[24px] p-5 flex items-center gap-5 border shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 active:scale-[0.98] ${med.taken ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-50'}`}
                        >
                            <button
                                onClick={() => toggleTaken(med._id!)}
                                className={`h-14 w-14 rounded-[18px] flex items-center justify-center shrink-0 border-2 transition-all duration-300 ${med.taken ? 'bg-emerald-100 border-emerald-200 text-emerald-600 scale-105 shadow-inner' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-emerald-500 hover:border-emerald-100'}`}
                            >
                                {med.taken ? <Check className="w-7 h-7" strokeWidth={3} /> : <Pill className="w-6 h-6" strokeWidth={2.2} />}
                            </button>

                            <div className="flex-1 min-w-0 pt-0.5">
                                <p className={`font-bold text-lg leading-tight transition-all ${med.taken ? 'text-emerald-700/60 line-through' : 'text-slate-900'}`}>{med.name}</p>
                                <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
                                    <span className="text-[12px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap uppercase tracking-wide">{med.dosage}</span>
                                    <span className="text-[12px] font-semibold text-slate-400 flex items-center gap-1 shrink-0"><Clock className="w-3 h-3" /> {med.time}</span>
                                </div>
                            </div>

                            <div className="text-right flex items-center gap-2 relative z-10">
                                <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors" onClick={() => removeMedicine(med._id!)}>
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}