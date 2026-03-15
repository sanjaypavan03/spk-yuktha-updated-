"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, Plus, Check, Clock, AlertTriangle, Trash2, X } from "lucide-react";
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

        // Client-side only tracking for this demo
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

    const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

    return (
        <div className="space-y-6 pb-24 sm:pb-8 bg-[#F8FAFC] min-h-screen font-sans">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-b-[24px] sm:rounded-2xl p-6 -mx-4 -mt-4 sm:mx-0 sm:mt-0 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold font-playfair tracking-tight">Med Tracker</h1>
                        <p className="text-blue-100 text-sm font-medium mt-1">{format(new Date(), 'EEEE, MMMM do')}</p>
                    </div>
                    <Button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Pill
                    </Button>
                </div>

                {/* Adherence Ring */}
                {totalCount > 0 && (
                    <div className="flex items-center gap-4 mt-6">
                        <div className="relative w-16 h-16">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="16" fill="none" className="stroke-white/20" strokeWidth="3" />
                                <circle cx="18" cy="18" r="16" fill="none" className="stroke-white" strokeWidth="3" strokeDasharray={`${adherencePercent}, 100`} strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{adherencePercent}%</span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold">{takenCount} of {totalCount} taken</p>
                            <p className="text-xs text-blue-200">
                                {adherencePercent === 100 ? "Perfect adherence today! 🎉" : adherencePercent >= 50 ? "Keep it up!" : "Don't forget your meds"}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Medicine Form */}
            {showAddForm && (
                <Card className="border-primary/20 shadow-lg animate-in slide-in-from-top-4 duration-300">
                    <CardContent className="p-5 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-slate-800">Add New Medicine</h3>
                            <Button size="icon" variant="ghost" onClick={() => setShowAddForm(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Medicine Name *</label>
                                <input type="text" value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} placeholder="e.g. Metformin" className={inputClass} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Dosage *</label>
                                <input type="text" value={newMed.dosage} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })} placeholder="e.g. 500mg" className={inputClass} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Time</label>
                                <input type="time" value={newMed.time} onChange={e => setNewMed({ ...newMed, time: e.target.value })} className={inputClass} />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Frequency</label>
                                <select value={newMed.frequency} onChange={e => setNewMed({ ...newMed, frequency: e.target.value })} className={inputClass}>
                                    <option>Once daily</option>
                                    <option>Twice daily</option>
                                    <option>Three times daily</option>
                                    <option>As needed</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Notes (optional)</label>
                                <input type="text" value={newMed.notes} onChange={e => setNewMed({ ...newMed, notes: e.target.value })} placeholder="e.g. Take after food" className={inputClass} />
                            </div>
                        </div>

                        <Button onClick={handleAddMedicine} className="w-full h-12 font-bold rounded-xl">
                            <Plus className="w-4 h-4 mr-2" /> Add to Tracker
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Medicine List */}
            <div className="px-1 space-y-3">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-white rounded-2xl h-20 border border-slate-100"></div>)}
                    </div>
                ) : medicines.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                        <Pill className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-700 font-playfair">No Medications</h3>
                        <p className="text-sm text-slate-500 mt-2">Tap "Add Pill" to start tracking your medications.</p>
                    </div>
                ) : (
                    medicines.map((med) => (
                        <div
                            key={med._id}
                            className={`bg-white rounded-2xl p-4 flex items-center gap-4 border shadow-sm transition-all ${med.taken ? 'border-green-200 bg-green-50/30' : 'border-slate-100'}`}
                        >
                            <button
                                onClick={() => toggleTaken(med._id!)}
                                className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${med.taken ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-500 hover:bg-blue-100'}`}
                            >
                                {med.taken ? <Check className="w-6 h-6" /> : <Pill className="w-5 h-5" />}
                            </button>

                            <div className="flex-1 min-w-0">
                                <p className={`font-bold text-sm ${med.taken ? 'text-green-700 line-through' : 'text-slate-800'}`}>{med.name}</p>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">{med.dosage} • {med.frequency}</p>
                                {med.notes && <p className="text-xs text-slate-400 mt-1 italic">{med.notes}</p>}
                            </div>

                            <div className="text-right flex items-center gap-2">
                                <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                                    <Clock className="w-3 h-3" /> {med.time}
                                </div>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-rose-500" onClick={() => removeMedicine(med._id!)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}