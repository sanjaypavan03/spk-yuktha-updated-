"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { User, Activity, CheckCircle2, Search, FileText, ChevronDown, ActivitySquare, Heart, Scale } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PremiumSelect } from "@/components/ui/premium-select";

export default function DoctorPatientsPage() {
    const { toast } = useToast();
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Clinical Data Entry State
    const [activePatient, setActivePatient] = useState<string | null>(null);
    const [clinicalData, setClinicalData] = useState({
        bpReading: '',
        fastingBloodSugar: '',
        bmi: '',
        conditionControlLevel: 'Stable'
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchPatients = async () => {
            setLoading(true);
            try {
                // Fetch all appointments for doctor and extract unique patients
                const res = await fetch('/api/appointments?date=all');
                if (res.ok) {
                    const data = await res.json();

                    const uniquePatientsMap = new Map();
                    data.appointments?.forEach((appt: any) => {
                        if (appt.patientId && !uniquePatientsMap.has(appt.patientId._id)) {
                            uniquePatientsMap.set(appt.patientId._id, appt.patientId);
                        }
                    });

                    setPatients(Array.from(uniquePatientsMap.values()));
                }
            } catch (error) {
                console.error("Failed to fetch doctor patients", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, []);

    const handleSubmitClinicalData = async (e: React.FormEvent, patientId: string) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/hospital/patient-clinical', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    ...clinicalData
                })
            });

            if (res.ok) {
                toast({ title: 'Success', description: 'Clinical data updated successfully' });
                setActivePatient(null);
                setClinicalData({ bpReading: '', fastingBloodSugar: '', bmi: '', conditionControlLevel: 'Stable' });
            } else {
                toast({ variant: 'destructive', description: 'Failed to update clinical data' });
            }
        } catch (error) {
            toast({ variant: 'destructive', description: 'Network error occurred' });
        } finally {
            setSubmitting(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white font-playfair tracking-tight mb-1">
                        My Patients
                    </h2>
                    <p className="text-slate-400 font-medium text-sm">
                        View patients and add clinical observations.
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                    type="text"
                    placeholder="Search by patient name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#02B69A] transition-all"
                />
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-slate-900 rounded-2xl h-24 border border-slate-800"></div>
                    ))}
                </div>
            ) : filteredPatients.length === 0 ? (
                <div className="bg-slate-900/50 rounded-2xl p-12 text-center border border-slate-800 border-dashed">
                    <User className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-300 font-playfair">No Patients Found</h3>
                    <p className="text-slate-500 mt-2 text-sm">You have not seen any patients yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredPatients.map((patient) => (
                        <Card key={patient._id} className="bg-slate-900 border-slate-800 shadow-none hover:border-slate-700 transition-colors overflow-hidden">
                            <CardContent className="p-0">
                                {/* Patient Header - Click to toggle entry form */}
                                <div
                                    className="p-5 flex items-center justify-between cursor-pointer group"
                                    onClick={() => setActivePatient(activePatient === patient._id ? null : patient._id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center shrink-0 border border-indigo-500/20">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-lg">{patient.name}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-slate-500 font-mono">{patient._id.slice(-6).toUpperCase()}</span>
                                                <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                                <span className="text-xs text-slate-400">{patient.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="hidden sm:flex text-[10px] font-bold text-[#02B69A] bg-[#02B69A]/10 px-3 py-1.5 rounded-lg border border-[#02B69A]/20">
                                            ADD READING
                                        </div>
                                        <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${activePatient === patient._id ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>

                                {/* Clinical Data Entry Form */}
                                {activePatient === patient._id && (
                                    <div className="px-5 pb-5 pt-2 border-t border-slate-800/50 bg-slate-950/50 animate-in slide-in-from-top-4 duration-200">
                                        <form onSubmit={(e) => handleSubmitClinicalData(e, patient._id)} className="mt-4">
                                            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#02B69A] mb-4">
                                                <ActivitySquare className="w-4 h-4" /> Clinical Observations
                                            </h4>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                                <div>
                                                    <label className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                                                        <Heart className="w-3.5 h-3.5 text-rose-400" /> BP Reading
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="120/80"
                                                        value={clinicalData.bpReading}
                                                        onChange={e => setClinicalData({ ...clinicalData, bpReading: e.target.value })}
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:ring-1 focus:ring-[#02B69A] focus:border-[#02B69A] outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                                                        <Activity className="w-3.5 h-3.5 text-blue-400" /> Fasting Sugar
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="95 mg/dL"
                                                        value={clinicalData.fastingBloodSugar}
                                                        onChange={e => setClinicalData({ ...clinicalData, fastingBloodSugar: e.target.value })}
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:ring-1 focus:ring-[#02B69A] focus:border-[#02B69A] outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                                                        <Scale className="w-3.5 h-3.5 text-orange-400" /> BMI
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="24.5"
                                                        value={clinicalData.bmi}
                                                        onChange={e => setClinicalData({ ...clinicalData, bmi: e.target.value })}
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:ring-1 focus:ring-[#02B69A] focus:border-[#02B69A] outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                                                        <FileText className="w-3.5 h-3.5 text-slate-400" /> Condition Control
                                                    </label>
                                                    <PremiumSelect
                                                        label="Condition Control"
                                                        value={clinicalData.conditionControlLevel}
                                                        onChange={val => setClinicalData({ ...clinicalData, conditionControlLevel: val })}
                                                        options={[
                                                            { value: 'Stable', label: 'Stable' },
                                                            { value: 'Improving', label: 'Improving' },
                                                            { value: 'Deteriorating', label: 'Deteriorating' },
                                                            { value: 'Critical', label: 'Critical' },
                                                        ]}
                                                        icon={FileText}
                                                        className="bg-slate-900 border-slate-800"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={submitting}
                                                    className="flex items-center gap-2 bg-[#02B69A] hover:bg-[#00D4AA] text-slate-950 font-bold px-6 py-2.5 rounded-lg transition-colors text-sm disabled:opacity-50"
                                                >
                                                    {submitting ? 'Saving...' : <><CheckCircle2 className="w-4 h-4" /> Save Observation</>}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
