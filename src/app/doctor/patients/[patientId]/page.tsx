"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    Activity, Pill, FileText, BarChart3, Clock, ChevronLeft, 
    Plus, Edit2, Check, X, AlertCircle, TrendingUp, Info, FlaskConical
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

export default function PatientDetailPage() {
    const { patientId } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [patientInfo, setPatientInfo] = useState<any>(null);
    const [medicalInfo, setMedicalInfo] = useState<any>(null);
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [adherenceData, setAdherenceData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [clinicalNotes, setClinicalNotes] = useState<any[]>([]);
    const [noteContent, setNoteContent] = useState('');
    const [isVisibleToPatient, setIsVisibleToPatient] = useState(true);
    const [savingNote, setSavingNote] = useState(false);

    // Edit states
    const [isEditingClinical, setIsEditingClinical] = useState(false);
    const [clinicalFormData, setClinicalFormData] = useState({
        bpReading: '',
        fastingBloodSugar: '',
        bmi: '',
        conditionControlLevel: ''
    });

    // Prescription form
    const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
    const [newPrescription, setNewPrescription] = useState({
        medicineName: '',
        dosage: '',
        frequency: '',
        duration: '7'
    });

    // Test Recommendation form
    const [showTestForm, setShowTestForm] = useState(false);
    const [testRecommendation, setTestRecommendation] = useState({
        testName: '',
        urgency: 'Routine',
        notes: ''
    });

    // Inpatient / Admission State
    const [activeAdmission, setActiveAdmission] = useState<any>(null);
    const [ipRoundNote, setIpRoundNote] = useState('');
    const [savingIPNote, setSavingIPNote] = useState(false);
    const [showDischargeModal, setShowDischargeModal] = useState(false);
    const [dischargeNote, setDischargeNote] = useState('');
    const [discharging, setDischarging] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                // 1. Basic Info & MedicalInfo
                const infoRes = await fetch(`/api/doctor/patient-info/${patientId}`);
                if (infoRes.ok) {
                    const data = await infoRes.json();
                    setMedicalInfo(data.medicalInfo);
                    setClinicalFormData({
                        bpReading: data.medicalInfo.bpReading || '',
                        fastingBloodSugar: data.medicalInfo.fastingBloodSugar || '',
                        bmi: data.medicalInfo.bmi || '',
                        conditionControlLevel: data.medicalInfo.conditionControlLevel || 'Stable'
                    });
                } else {
                    toast({ variant: "destructive", description: "Could not fetch patient medical records" });
                    router.push('/doctor/patients');
                    return;
                }

                // 2. Prescriptions
                const prescRes = await fetch(`/api/doctor/prescriptions/${patientId}`);
                if (prescRes.ok) {
                    const data = await prescRes.json();
                    setPrescriptions(data.prescriptions || []);
                }

                // 3. Health & Adherence
                const healthRes = await fetch(`/api/doctor/patient-health/${patientId}`);
                if (healthRes.ok) {
                    const data = await healthRes.json();
                    setAdherenceData(data);
                }

                // 4. Reports
                const reportsRes = await fetch(`/api/doctor/patient-reports/${patientId}`);
                if (reportsRes.ok) {
                    const data = await reportsRes.json();
                    setReports(data.reports || []);
                }

                // 5. Clinical Notes
                const notesRes = await fetch(`/api/doctor/clinical-note?patientId=${patientId}`);
                if (notesRes.ok) {
                    const data = await notesRes.json();
                    setClinicalNotes(data.notes || []);
                }

                // 6. Active Admission (IP)
                const ipRes = await fetch(`/api/doctor/ip-rounds`);
                if (ipRes.ok) {
                    const data = await ipRes.json();
                    const active = data.rounds?.find((a: any) => 
                        a.patientId?._id === patientId || a.patientId === patientId
                    );
                    setActiveAdmission(active || null);
                }

            } catch (error) {
                console.error("Error fetching patient data:", error);
                toast({ variant: "destructive", description: "Failed to load patient profile" });
            } finally {
                setLoading(false);
            }
        };

        if (patientId) fetchAllData();
    }, [patientId]);

    const handleUpdateClinical = async () => {
        try {
            const res = await fetch('/api/hospital/patient-clinical', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    ...clinicalFormData
                })
            });

            if (res.ok) {
                const data = await res.json();
                setMedicalInfo(data.medicalInfo);
                setIsEditingClinical(false);
                toast({ description: "Clinical details updated" });
            } else {
                toast({ variant: "destructive", description: "Failed to update details" });
            }
        } catch (error) {
            toast({ variant: "destructive", description: "Internal error occurred" });
        }
    };

    const handleIssuePrescription = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/hospital/prescribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    medicineName: newPrescription.medicineName,
                    dosage: newPrescription.dosage,
                    frequency: newPrescription.frequency,
                    duration: parseInt(newPrescription.duration)
                })
            });

            if (res.ok) {
                toast({ description: "Prescription issued successfully" });
                setShowPrescriptionForm(false);
                setNewPrescription({ medicineName: '', dosage: '', frequency: '', duration: '7' });
                // Refresh list
                const prescRes = await fetch(`/api/doctor/prescriptions/${patientId}`);
                const data = await prescRes.json();
                setPrescriptions(data.prescriptions || []);
            } else {
                const err = await res.json();
                toast({ variant: "destructive", description: err.error || "Failed to issue prescription" });
            }
        } catch (error) {
            toast({ variant: "destructive", description: "Internal error occurred" });
        }
    };

    const handleRecommendTest = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/doctor/test-recommendation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    ...testRecommendation
                })
            });

            if (res.ok) {
                toast({ description: "Test recommendation sent to patient" });
                setShowTestForm(false);
                setTestRecommendation({ testName: '', urgency: 'Routine', notes: '' });
            } else {
                toast({ variant: "destructive", description: "Failed to submit recommendation" });
            }
        } catch (error) {
            toast({ variant: "destructive", description: "Internal error occurred" });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#02B69A] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Patient Profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Bio */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.back()}
                        className="rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-bold text-white font-playfair tracking-tight">Patient Profile</h1>
                            <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-[10px] font-mono tracking-wider border border-slate-700">
                                {(patientId as string)?.slice(-6).toUpperCase()}
                            </span>
                        </div>
                        <p className="text-slate-400 font-medium">Viewing clinical history and active treatments</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {activeAdmission && (
                        <Button 
                            variant="destructive"
                            className="bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white"
                            onClick={() => setShowDischargeModal(true)}
                        >
                            Discharge Patient
                        </Button>
                    )}
                    <Button 
                        variant="outline" 
                        className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                        onClick={() => {
                            // Logic to open appointment modal or navigate to scheduling
                            toast({ description: "Opening scheduling module..." });
                            // This would ideally open a modal for Date/Time selection
                        }}
                    >
                        Schedule Follow-up
                    </Button>
                    <Button 
                        variant="outline" 
                        className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                        onClick={() => setShowTestForm(true)}
                    >
                        Recommend Test
                    </Button>
                    <Button 
                        className="bg-[#02B69A] hover:bg-[#00D4AA] text-slate-950 font-bold shadow-lg shadow-[#02B69A]/20"
                        onClick={() => setShowPrescriptionForm(true)}
                    >
                        <Plus className="w-4 h-4 mr-2" /> New Prescription
                    </Button>
                </div>
            </div>

            {/* Vitals Summary Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-slate-900 border-slate-800 overflow-hidden group">
                    <CardContent className="p-6 relative">
                        <TrendingUp className="absolute top-4 right-4 w-4 h-4 text-[#02B69A] opacity-20 group-hover:opacity-100 transition-opacity" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Blood Pressure</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-white">{medicalInfo?.bpReading || '--/--'}</p>
                            <span className="text-[10px] text-slate-600 font-bold">mmHg</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 overflow-hidden group">
                    <CardContent className="p-6 relative">
                        <Activity className="absolute top-4 right-4 w-4 h-4 text-rose-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Blood Sugar (FBS)</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-white">{medicalInfo?.fastingBloodSugar || '--'}</p>
                            <span className="text-[10px] text-slate-600 font-bold">mg/dL</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 overflow-hidden group">
                    <CardContent className="p-6 relative">
                        <TrendingUp className="absolute top-4 right-4 w-4 h-4 text-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Patient BMI</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-white">{medicalInfo?.bmi || '--'}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`bg-slate-900 border-slate-800 overflow-hidden group ${medicalInfo?.conditionControlLevel === 'Uncontrolled' ? 'border-rose-500/30' : ''}`}>
                    <CardContent className="p-6 relative">
                        <AlertCircle className={`absolute top-4 right-4 w-4 h-4 ${medicalInfo?.conditionControlLevel === 'Uncontrolled' ? 'text-rose-500' : 'text-[#02B69A]'} opacity-20 group-hover:opacity-100 transition-opacity`} />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Condition Control</p>
                        <p className={`text-xl font-bold ${medicalInfo?.conditionControlLevel === 'Uncontrolled' ? 'text-rose-500' : medicalInfo?.conditionControlLevel === 'Poorly controlled' ? 'text-amber-500' : 'text-white'}`}>
                            {medicalInfo?.conditionControlLevel || 'Unknown'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Tabs Interaction */}
            <Tabs defaultValue="clinical" className="w-full">
                <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-2xl mb-8">
                    <TabsTrigger value="clinical" className="px-6 py-2.5 rounded-xl data-[state=active]:bg-[#02B69A] data-[state=active]:text-slate-950 font-bold text-xs uppercase tracking-widest">Clinical Data</TabsTrigger>
                    <TabsTrigger value="prescriptions" className="px-6 py-2.5 rounded-xl data-[state=active]:bg-[#02B69A] data-[state=active]:text-slate-950 font-bold text-xs uppercase tracking-widest">Prescriptions</TabsTrigger>
                    <TabsTrigger value="reports" className="px-6 py-2.5 rounded-xl data-[state=active]:bg-[#02B69A] data-[state=active]:text-slate-950 font-bold text-xs uppercase tracking-widest">Lab Reports</TabsTrigger>
                    <TabsTrigger value="adherence" className="px-6 py-2.5 rounded-xl data-[state=active]:bg-[#02B69A] data-[state=active]:text-slate-950 font-bold text-xs uppercase tracking-widest">Adherence</TabsTrigger>
                </TabsList>

                <TabsContent value="clinical">
                    <Card className="bg-slate-900 border-slate-800 rounded-[32px] overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-800 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold text-white font-playfair tracking-tight mb-1">Clinical Vitals & Monitoring</CardTitle>
                                <p className="text-slate-500 text-sm font-medium">Last updated: {medicalInfo?.lastClinicalVisitDate ? format(new Date(medicalInfo.lastClinicalVisitDate), 'PPP') : 'Never'}</p>
                            </div>
                            {!isEditingClinical ? (
                                <Button onClick={() => setIsEditingClinical(true)} variant="outline" className="border-slate-800 text-slate-400 hover:text-white gap-2">
                                    <Edit2 className="w-4 h-4" /> Edit Readings
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button onClick={() => setIsEditingClinical(false)} variant="ghost" className="text-slate-500">Cancel</Button>
                                    <Button onClick={handleUpdateClinical} className="bg-[#02B69A] text-slate-950 font-bold px-6">Save Changes</Button>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Blood Pressure Reading</label>
                                        {isEditingClinical ? (
                                            <Input 
                                                value={clinicalFormData.bpReading}
                                                onChange={(e) => setClinicalFormData({...clinicalFormData, bpReading: e.target.value})}
                                                className="bg-slate-950 border-slate-800 text-white p-6 rounded-2xl" 
                                                placeholder="e.g. 120/80" 
                                            />
                                        ) : (
                                            <p className="text-2xl font-bold text-white">{medicalInfo?.bpReading || '--/--'}</p>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Fasting Blood Sugar</label>
                                        {isEditingClinical ? (
                                            <Input 
                                                value={clinicalFormData.fastingBloodSugar}
                                                onChange={(e) => setClinicalFormData({...clinicalFormData, fastingBloodSugar: e.target.value})}
                                                className="bg-slate-950 border-slate-800 text-white p-6 rounded-2xl" 
                                                placeholder="mg/dL" 
                                            />
                                        ) : (
                                            <p className="text-2xl font-bold text-white">{medicalInfo?.fastingBloodSugar || '--'}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Calculated BMI</label>
                                        {isEditingClinical ? (
                                            <Input 
                                                value={clinicalFormData.bmi}
                                                onChange={(e) => setClinicalFormData({...clinicalFormData, bmi: e.target.value})}
                                                className="bg-slate-950 border-slate-800 text-white p-6 rounded-2xl" 
                                            />
                                        ) : (
                                            <p className="text-2xl font-bold text-white">{medicalInfo?.bmi || '--'}</p>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Condition Control Level</label>
                                        {isEditingClinical ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                {['Excellent', 'Stable', 'Poorly controlled', 'Uncontrolled'].map(level => (
                                                    <button
                                                        key={level}
                                                        onClick={() => setClinicalFormData({...clinicalFormData, conditionControlLevel: level})}
                                                        className={`p-3 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all ${clinicalFormData.conditionControlLevel === level ? 'bg-[#02B69A] border-[#02B69A] text-slate-950 shadow-lg shadow-[#02B69A]/20' : 'bg-slate-950 border-slate-800 text-slate-500 hove:border-slate-700'}`}
                                                    >
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${medicalInfo?.conditionControlLevel === 'Uncontrolled' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-[#02B69A]/10 text-[#02B69A] border-[#02B69A]/20'}`}>
                                                {medicalInfo?.conditionControlLevel || 'Unknown'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* NEW: Inpatient Round / Progress Update (Only if admitted) */}
                    {activeAdmission && (
                        <Card className="bg-[#02B69A]/5 border-[#02B69A]/20 rounded-[32px] overflow-hidden mt-8">
                            <CardHeader className="p-8 border-b border-[#02B69A]/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#02B69A] text-slate-950 rounded-xl flex items-center justify-center">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold text-white font-playfair tracking-tight">Inpatient Round Progress</CardTitle>
                                        <p className="text-[#02B69A] text-[10px] font-black uppercase tracking-widest mt-1">
                                            Admitted since {activeAdmission.admissionDate ? format(new Date(activeAdmission.admissionDate), 'PPP') : 'N/A'} • Room {activeAdmission.roomNumber}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Add Progress Note (Daily Round)</label>
                                    <Textarea 
                                        placeholder="Note patient's daily improvement, symptoms, or adjustment to treatment during rounds..."
                                        className="bg-slate-950 border-slate-800 text-white p-6 rounded-2xl min-h-[140px] focus:border-[#02B69A]"
                                        value={ipRoundNote}
                                        onChange={(e) => setIpRoundNote(e.target.value)}
                                    />
                                    <Button 
                                        disabled={savingIPNote || !ipRoundNote.trim()}
                                        onClick={async () => {
                                            setSavingIPNote(true);
                                            try {
                                                const res = await fetch('/api/doctor/ip-rounds', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        admissionId: activeAdmission._id,
                                                        note: ipRoundNote
                                                    })
                                                });
                                                if (res.ok) {
                                                    toast({ description: "Round note saved" });
                                                    setIpRoundNote('');
                                                }
                                            } catch (e) {
                                                toast({ variant: "destructive", description: "Failed to save note" });
                                            } finally {
                                                setSavingIPNote(false);
                                            }
                                        }}
                                        className="bg-[#02B69A] hover:bg-[#00D4AA] text-slate-950 font-black px-8 py-6 rounded-2xl h-auto"
                                    >
                                        {savingIPNote ? 'Saving...' : 'Update Daily Progress'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* NEW: Clinical Notes & Advice Section */}
                    <Card className="bg-slate-900 border-slate-800 rounded-[32px] overflow-hidden mt-8">
                        <CardHeader className="p-8 border-b border-slate-800 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold text-white font-playfair tracking-tight">Doctor's Notes & Advice</CardTitle>
                                <p className="text-slate-500 text-sm font-medium">Record clinical advice and patient instructions.</p>
                            </div>
                            <FileText className="w-6 h-6 text-[#02B69A] opacity-20" />
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            {/* Note History */}
                            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-4">
                                {clinicalNotes.length === 0 ? (
                                    <div className="text-center py-10 border border-slate-800 border-dashed rounded-2xl">
                                        <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">No previous advice recorded</p>
                                    </div>
                                ) : (
                                    clinicalNotes.map((note) => (
                                        <div key={note._id} className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-2 relative group hover:border-[#02B69A]/30 transition-all">
                                            <div className="flex justify-between items-start">
                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${note.isVisibleToPatient ? 'bg-[#02B69A]/10 text-[#02B69A] border-[#02B69A]/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                                                    {note.isVisibleToPatient ? 'Visible to Patient' : 'Private Note'}
                                                </span>
                                                <span className="text-[10px] text-slate-600 font-medium">{format(new Date(note.createdAt), 'MMM d, h:mm a')}</span>
                                            </div>
                                            <p className="text-slate-300 text-sm leading-relaxed">{note.content}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add New Note Form */}
                            <div className="pt-8 border-t border-slate-800 space-y-4">
                                <Textarea 
                                    placeholder="Write clinical advice, diet recommendations, or general notes..."
                                    className="bg-slate-950 border-slate-800 text-white p-6 rounded-2xl min-h-[120px] focus:border-[#02B69A] transition-all"
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => setIsVisibleToPatient(!isVisibleToPatient)}
                                            className={`w-10 h-5 rounded-full transition-all relative ${isVisibleToPatient ? 'bg-[#02B69A]' : 'bg-slate-800'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isVisibleToPatient ? 'left-6' : 'left-1'}`} />
                                        </button>
                                        <span className="text-xs font-bold text-slate-400">Visible to patient</span>
                                    </div>
                                    <Button 
                                        disabled={savingNote || !noteContent.trim()}
                                        onClick={async () => {
                                            setSavingNote(true);
                                            try {
                                                const res = await fetch('/api/doctor/clinical-note', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        patientId,
                                                        content: noteContent,
                                                        isVisibleToPatient,
                                                        noteType: 'advice'
                                                    })
                                                });
                                                if (res.ok) {
                                                    const data = await res.json();
                                                    setClinicalNotes([data.note, ...clinicalNotes]);
                                                    setNoteContent('');
                                                    toast({ description: "Advice saved successfully" });
                                                }
                                            } catch (e) {
                                                toast({ variant: "destructive", description: "Failed to save advice" });
                                            } finally {
                                                setSavingNote(false);
                                            }
                                        }}
                                        className="bg-[#02B69A] hover:bg-[#00D4AA] text-slate-950 font-black px-8 py-6 rounded-2xl h-auto uppercase tracking-widest text-xs"
                                    >
                                        {savingNote ? 'Saving...' : 'Save & Sync Advice'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="prescriptions">
                    <div className="space-y-6">
                        {prescriptions.length === 0 ? (
                            <div className="bg-slate-900 border border-slate-800 border-dashed rounded-[32px] p-20 text-center">
                                <Pill className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold text-lg mb-1">No prescriptions found</p>
                                <p className="text-slate-600 text-sm mb-6">Issue an electronic Rx to start tracking medication adherence.</p>
                                <Button onClick={() => setShowPrescriptionForm(true)} className="bg-[#02B69A] hover:bg-[#00D4AA] text-slate-950 font-black">Issue First Prescription</Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {prescriptions.map((presc) => (
                                    <Card key={presc._id} className="bg-slate-900 border-slate-800 hover:border-[#02B69A]/30 transition-all group overflow-hidden">
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-[#02B69A]/10 text-[#02B69A] rounded-xl flex items-center justify-center shrink-0 border border-[#02B69A]/20">
                                                        <Pill className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white group-hover:text-[#02B69A] transition-colors">{presc.medicineName}</h4>
                                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{presc.dosage} • {presc.frequency}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-600">{format(new Date(presc.issuedAt), 'MMM d, yyyy')}</span>
                                            </div>
                                            <div className="flex items-center gap-4 pt-4 border-t border-slate-800/50">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                                                    <span className="text-[11px] font-bold text-slate-400">{presc.duration} Days</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 ml-auto">
                                                    <div className="w-1.5 h-1.5 bg-[#02B69A] rounded-full animate-pulse"></div>
                                                    <span className="text-[10px] font-black text-[#02B69A] uppercase tracking-widest">Active</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="reports">
                    <div className="space-y-4">
                        {reports.length === 0 ? (
                            <div className="bg-slate-900 border border-slate-800 border-dashed rounded-[32px] p-20 text-center text-slate-600">
                                No diagnostic reports available for this patient.
                            </div>
                        ) : (
                            reports.map(report => (
                                <Card key={report._id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all rounded-[24px]">
                                    <CardContent className="p-6 flex items-start gap-5">
                                        <div className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center shrink-0">
                                            <FileText className="w-7 h-7 text-[#02B69A]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-lg font-bold text-white truncate">{report.title}</h4>
                                                <span className="text-[11px] font-bold text-slate-500">{format(new Date(report.date), 'MMM d, yyyy')}</span>
                                            </div>
                                            <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl">
                                                <p className="text-[10px] font-black text-[#02B69A] uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                                    <FlaskConical className="w-3.5 h-3.5" /> Clinical Insight
                                                </p>
                                                <p className="text-[13px] text-slate-400 leading-relaxed italic line-clamp-2">
                                                    "{report.analysis?.summary || 'AI synthesis pending for this document...'}"
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="adherence">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Score Card */}
                        <Card className="bg-slate-900 border-slate-800 rounded-[32px] p-8 flex flex-col items-center justify-center text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Adherence Score</p>
                            <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-[#02B69A]" strokeDasharray={364} strokeDashoffset={364 - (364 * (adherenceData?.score || 0)) / 100} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-white">{adherenceData?.score || 0}%</span>
                                </div>
                            </div>
                            <p className="text-xs font-bold text-slate-400 leading-relaxed px-4">
                                Overall medical compliance based on registered treatments.
                            </p>
                        </Card>

                        {/* Chart Area */}
                        <Card className="lg:col-span-3 bg-slate-900 border-slate-800 rounded-[32px] p-8">
                            <h3 className="text-xl font-bold text-white font-playfair tracking-tight mb-8">Treatment Compliance (Last 7 Days)</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={adherenceData?.chartData || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" opacity={0.3} />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fill: '#64748B', fontSize: 11, fontWeight: 'bold'}} 
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fill: '#64748B', fontSize: 11, fontWeight: 'bold'}} 
                                        />
                                        <Tooltip 
                                            cursor={{fill: '#1e293b'}} 
                                            contentStyle={{backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px'}}
                                        />
                                        <Bar dataKey="taken" fill="#02B69A" radius={[6, 6, 0, 0]} barSize={40}>
                                            {adherenceData?.chartData?.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.taken === 0 ? '#1E293B' : '#02B69A'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-800/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-[#02B69A] rounded-full"></div>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Taken</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-rose-500/30 rounded-full border border-rose-500/30"></div>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Missed / Pending</span>
                                </div>
                             </div>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modals / Forms */}
            {/* 1. New Prescription Sheet/Modal (Simplified View) */}
            {showPrescriptionForm && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="bg-slate-900 border-slate-800 w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <CardHeader className="p-8 border-b border-slate-800">
                            <CardTitle className="text-2xl font-bold text-white font-playfair tracking-tight">Issue Digital Rx</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handleIssuePrescription} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Medicine Name</label>
                                    <Input 
                                        required
                                        value={newPrescription.medicineName}
                                        onChange={(e) => setNewPrescription({...newPrescription, medicineName: e.target.value})}
                                        className="bg-slate-950 border-slate-800 text-white rounded-xl"
                                        placeholder="e.g. Amlodipine 5mg"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dosage</label>
                                        <Input 
                                            required
                                            value={newPrescription.dosage}
                                            onChange={(e) => setNewPrescription({...newPrescription, dosage: e.target.value})}
                                            className="bg-slate-950 border-slate-800 text-white rounded-xl"
                                            placeholder="e.g. 1 Tablet"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Frequency</label>
                                        <Input 
                                            required
                                            value={newPrescription.frequency}
                                            onChange={(e) => setNewPrescription({...newPrescription, frequency: e.target.value})}
                                            className="bg-slate-950 border-slate-800 text-white rounded-xl"
                                            placeholder="e.g. Once daily (Night)"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Duration (Days)</label>
                                    <Input 
                                        type="number"
                                        required
                                        value={newPrescription.duration}
                                        onChange={(e) => setNewPrescription({...newPrescription, duration: e.target.value})}
                                        className="bg-slate-950 border-slate-800 text-white rounded-xl"
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button type="button" variant="ghost" className="flex-1 text-slate-500" onClick={() => setShowPrescriptionForm(false)}>Cancel</Button>
                                    <Button type="submit" className="flex-1 bg-[#02B69A] hover:bg-[#00D4AA] text-slate-950 font-black">Generate Rx</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* 2. Recommend Test Modal */}
            {showTestForm && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="bg-slate-900 border-slate-800 w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in duration-300">
                        <CardHeader className="p-8 border-b border-slate-800">
                            <CardTitle className="text-2xl font-bold text-white font-playfair tracking-tight">Order Test / Lab Request</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handleRecommendTest} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Test / Scan Name</label>
                                    <Input 
                                        required
                                        value={testRecommendation.testName}
                                        onChange={(e) => setTestRecommendation({...testRecommendation, testName: e.target.value})}
                                        className="bg-slate-950 border-slate-800 text-white rounded-xl"
                                        placeholder="e.g. HbA1c, Vitamin D, Chest X-Ray"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Urgency</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Routine', 'Urgent', 'Emergency'].map(level => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setTestRecommendation({...testRecommendation, urgency: level as any})}
                                                className={`py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${testRecommendation.urgency === level ? 'bg-[#02B69A] border-[#02B69A] text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Clinical Notes (Optional)</label>
                                    <Textarea 
                                        value={testRecommendation.notes}
                                        onChange={(e) => setTestRecommendation({...testRecommendation, notes: e.target.value})}
                                        className="bg-slate-950 border-slate-800 text-white rounded-xl min-h-[100px]"
                                        placeholder="Add instructions for the patient or radiologist..."
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button type="button" variant="ghost" className="flex-1 text-slate-500" onClick={() => setShowTestForm(false)}>Discard</Button>
                                    <Button type="submit" className="flex-1 bg-[#02B69A] hover:bg-[#00D4AA] text-slate-950 font-black">Submit Recommendation</Button>
                                </div>
                                <div className="flex items-center gap-2 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                    <Info className="w-4 h-4 text-indigo-400" />
                                    <p className="text-[10px] text-indigo-300 font-medium">This recommendation will be instantly visible on the patient's dashboard.</p>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* 3. Discharge Patient Modal */}
            {showDischargeModal && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <Card className="bg-slate-900 border-rose-500/30 w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <CardHeader className="p-8 border-b border-slate-800 bg-rose-500/5">
                            <CardTitle className="text-2xl font-bold text-rose-500 font-playfair tracking-tight">Final Discharge Summary</CardTitle>
                            <p className="text-slate-500 text-sm mt-1">This will finalize the stay for {patientInfo?.name || 'the patient'}.</p>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Discharge Advice & Summary</label>
                                <Textarea 
                                    required
                                    placeholder="Summary of treatment, final condition, and post-discharge instructions..."
                                    className="bg-slate-950 border-slate-800 text-white p-6 rounded-2xl min-h-[160px] focus:border-rose-500 transition-all"
                                    value={dischargeNote}
                                    onChange={(e) => setDischargeNote(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-4">
                                <Button type="button" variant="ghost" className="flex-1 text-slate-500" onClick={() => setShowDischargeModal(false)}>Cancel</Button>
                                <Button 
                                    disabled={discharging || !dischargeNote.trim()}
                                    onClick={async () => {
                                        setDischarging(true);
                                        try {
                                            const res = await fetch('/api/doctor/discharge', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    admissionId: activeAdmission._id,
                                                    dischargeNote
                                                })
                                            });
                                            if (res.ok) {
                                                toast({ description: "Patient successfully discharged" });
                                                setShowDischargeModal(false);
                                                setActiveAdmission(null); // Clear active admission
                                            } else {
                                                toast({ variant: "destructive", description: "Failed to process discharge" });
                                            }
                                        } catch (e) {
                                            toast({ variant: "destructive", description: "Network error" });
                                        } finally {
                                            setDischarging(false);
                                        }
                                    }}
                                    className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-black"
                                >
                                    {discharging ? 'Processing...' : 'Confirm Discharge'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
