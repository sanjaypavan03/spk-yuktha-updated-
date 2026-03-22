"use client";

import { useState, useEffect, useCallback } from "react";
import { 
    Calendar, 
    User, 
    Search, 
    CheckCircle2, 
    Clock, 
    BedDouble, 
    Loader2, 
    Plus,
    Activity,
    ChevronRight,
    SearchX
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReceptionistAppointments() {
    const [mode, setMode] = useState<'OP' | 'IP'>('OP');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [receptionist, setReceptionist] = useState<any>(null);

    // Form States
    const [opForm, setOpForm] = useState({ doctorId: '', date: '', timeSlot: '', reason: '' });
    const [ipForm, setIpForm] = useState({ doctorId: '', ward: '', bedNumber: '', admissionReason: '', admissionDate: new Date().toISOString().split('T')[0] });
    const [slots, setSlots] = useState<string[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState<any>(null);

    useEffect(() => {
        fetch('/api/receptionist/me').then(r => r.json()).then(d => setReceptionist(d.user));
        fetch('/api/hospital/staff').then(r => r.json()).then(d => setDoctors(d.doctors || []));
    }, []);

    const searchPatients = useCallback(async (q: string) => {
        if (q.length < 2) { setSearchResults([]); return; }
        setSearching(true);
        try {
            const res = await fetch(`/api/hospital/patient-search?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data.patients || []);
            }
        } catch (e) { console.error(e); }
        finally { setSearching(false); }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => searchPatients(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery, searchPatients]);

    const fetchSlots = async (doctorId: string, date: string) => {
        if (!doctorId || !date) return;
        setSlotsLoading(true);
        try {
            const res = await fetch(`/api/appointments/slots?date=${date}&doctorId=${doctorId}`);
            if (res.ok) {
                const data = await res.json();
                setSlots(data.slots || []);
            }
        } catch (e) { console.error(e); }
        finally { setSlotsLoading(false); }
    };

    const handleOPSubmit = async () => {
        setSubmitting(true);
        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: selectedPatient._id,
                    doctorId: opForm.doctorId,
                    date: opForm.date,
                    timeSlot: opForm.timeSlot,
                    reason: opForm.reason || 'Routine Checkup'
                })
            });
            if (res.ok) {
                setSuccess({ type: 'OP', doctor: doctors.find(d => d._id === opForm.doctorId)?.name, slot: opForm.timeSlot });
            }
        } catch (e) { console.error(e); }
        finally { setSubmitting(false); }
    };

    const handleIPSubmit = async () => {
        setSubmitting(true);
        try {
            const res = await fetch('/api/hospital/ip-admission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: selectedPatient._id,
                    doctorId: ipForm.doctorId,
                    ward: ipForm.ward,
                    bedNumber: ipForm.bedNumber,
                    admissionReason: ipForm.admissionReason,
                    admissionDate: ipForm.admissionDate
                })
            });
            if (res.ok) {
                setSuccess({ type: 'IP', ward: ipForm.ward, bed: ipForm.bedNumber });
            }
        } catch (e) { console.error(e); }
        finally { setSubmitting(false); }
    };

    const inputClass = "w-full bg-black border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-[#02B69A] outline-none transition-all placeholder:text-slate-700";

    if (success) {
        return (
            <div className="max-w-2xl mx-auto py-12">
                <Card className="bg-slate-900 border-[#02B69A]/30 p-12 text-center space-y-8 shadow-2xl animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-[#02B69A] rounded-full flex items-center justify-center mx-auto shadow-lg shadow-[#02B69A]/20">
                        <CheckCircle2 className="w-10 h-10 text-black" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-3xl font-black text-white font-playfair tracking-tight">
                            {success.type === 'OP' ? 'Appointment Confirmed' : 'Admission Initiated'}
                        </h3>
                        <p className="text-slate-400">Successfully processed for <strong className="text-white">{selectedPatient.name}</strong></p>
                    </div>
                    
                    <div className="bg-black/50 border border-slate-800 rounded-3xl p-6 text-left space-y-3 max-w-sm mx-auto">
                        {success.type === 'OP' ? (
                            <>
                                <div><p className="text-[10px] uppercase text-slate-500 font-bold">Doctor</p><p className="text-sm font-bold text-white">Dr. {success.doctor}</p></div>
                                <div><p className="text-[10px] uppercase text-slate-500 font-bold">Time Slot</p><p className="text-sm font-bold text-white">{success.slot}</p></div>
                            </>
                        ) : (
                            <>
                                <div><p className="text-[10px] uppercase text-slate-500 font-bold">Location</p><p className="text-sm font-bold text-white">{success.ward} · Bed {success.bed}</p></div>
                            </>
                        )}
                    </div>

                    <div className="pt-4 space-y-4">
                        <Button onClick={() => window.location.reload()} className="w-full bg-[#02B69A] hover:bg-[#00D4AA] text-black font-black h-14 rounded-xl text-sm uppercase tracking-widest">
                            New Appointment
                        </Button>
                        <Button variant="ghost" onClick={() => window.location.href='/receptionist/dashboard'} className="w-full text-slate-500 hover:text-white font-bold uppercase tracking-widest">
                            Return to Dashboard
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-[10px] font-black text-[#02B69A] uppercase tracking-[0.2em] mb-2">Hospital Resource Planning</h2>
                    <h1 className="text-4xl md:text-5xl font-playfair font-black text-white italic tracking-tighter">
                        Manage Appointments
                    </h1>
                </div>
                <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shrink-0">
                    {['OP', 'IP'].map(m => (
                        <button key={m} onClick={() => setMode(m as any)} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-[#02B69A] text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                            {m === 'OP' ? 'Outpatient' : 'Inpatient'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Find Patient */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-lg font-bold text-white font-playfair flex items-center gap-2 px-2">
                        <User className="w-5 h-5 text-[#02B69A]" /> Find Patient
                    </h3>
                    <Card className="bg-slate-900 border-slate-800 shadow-xl py-6">
                        <CardContent className="space-y-6">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                <input
                                    type="text"
                                    placeholder="Name or Phone..."
                                    value={searchQuery}
                                    onChange={e => { setSearchQuery(e.target.value); setSelectedPatient(null); }}
                                    className={`${inputClass} pl-12`}
                                />
                                {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#02B69A] animate-spin" />}
                            </div>

                            {searchResults.length > 0 && !selectedPatient && (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {searchResults.map(p => (
                                        <div key={p._id} onClick={() => setSelectedPatient(p)} className="flex items-center gap-3 p-3 bg-black/40 border border-slate-800 rounded-2xl cursor-pointer hover:border-[#02B69A]/30 transition-all group">
                                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-[#02B69A]/10 transition-colors">
                                                <User className="w-5 h-5 text-slate-600 group-hover:text-[#02B69A]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{p.name}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">{p.phone}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedPatient && (
                                <div className="bg-[#02B69A]/5 border border-[#02B69A]/20 rounded-3xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
                                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto border border-slate-800">
                                        <User className="w-8 h-8 text-[#02B69A]" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-lg font-black text-white">{selectedPatient.name}</p>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{selectedPatient.phone}</p>
                                    </div>
                                    <Button variant="ghost" onClick={() => setSelectedPatient(null)} className="text-[10px] uppercase font-black text-slate-500 hover:text-rose-400">
                                        Change Patient
                                    </Button>
                                </div>
                            )}

                            {!selectedPatient && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                                <div className="text-center py-8 space-y-4">
                                    <SearchX className="w-10 h-10 text-slate-800 mx-auto" />
                                    <p className="text-xs text-slate-500 font-medium italic">No patient found.</p>
                                    <Button onClick={() => window.location.href='/receptionist/register'} variant="outline" className="text-[10px] font-black uppercase tracking-widest border-slate-800 text-slate-400 hover:text-white">
                                        Register New Patient
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Booking Form */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold text-white font-playfair flex items-center gap-2 px-2">
                        {mode === 'OP' ? <Activity className="w-5 h-5 text-[#02B69A]" /> : <BedDouble className="w-5 h-5 text-[#02B69A]" />} 
                        {mode === 'OP' ? 'Outpatient Registration' : 'Inpatient Admission'}
                    </h3>
                    <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
                        <CardContent className="p-8 lg:p-12 space-y-8">
                            {!selectedPatient ? (
                                <div className="py-20 text-center space-y-4 bg-black/20 rounded-3xl border border-dashed border-slate-800">
                                    <User className="w-12 h-12 text-slate-800 mx-auto" />
                                    <p className="text-sm text-slate-500 font-medium font-playfair italic">Please select a patient to continue booking.</p>
                                </div>
                            ) : mode === 'OP' ? (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Consulting Physician</label>
                                            <select 
                                                className={inputClass} 
                                                value={opForm.doctorId} 
                                                onChange={e => {
                                                    setOpForm({...opForm, doctorId: e.target.value});
                                                    if (opForm.date) fetchSlots(e.target.value, opForm.date);
                                                }}
                                            >
                                                <option value="">Select Doctor</option>
                                                {doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.name} ({d.specialty})</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Appointment Date</label>
                                            <input 
                                                type="date" 
                                                className={inputClass} 
                                                value={opForm.date} 
                                                onChange={e => {
                                                    setOpForm({...opForm, date: e.target.value, timeSlot: ''});
                                                    if (opForm.doctorId) fetchSlots(opForm.doctorId, e.target.value);
                                                }} 
                                            />
                                        </div>
                                    </div>

                                    {opForm.date && opForm.doctorId && (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Select Time Slot</label>
                                            {slotsLoading ? (
                                                <div className="flex items-center gap-2 text-slate-500 text-xs py-4"><Loader2 className="w-4 h-4 animate-spin text-[#02B69A]" /> Calculating availability...</div>
                                            ) : slots.length === 0 ? (
                                                <p className="text-xs text-rose-400 bg-rose-400/5 p-3 rounded-xl border border-rose-400/10 inline-block">No available slots for this date.</p>
                                            ) : (
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                                    {slots.map(slot => (
                                                        <button 
                                                            key={slot} 
                                                            onClick={() => setOpForm({...opForm, timeSlot: slot})}
                                                            className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                                                                opForm.timeSlot === slot
                                                                    ? 'bg-[#02B69A] text-black border-[#02B69A] shadow-lg shadow-[#02B69A]/10'
                                                                    : 'bg-black border-slate-800 text-slate-500 hover:border-slate-600'
                                                            }`}
                                                        >
                                                            {slot}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-1.5 pt-4">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Primary Concern / Reason</label>
                                        <textarea 
                                            className={inputClass} 
                                            rows={2} 
                                            placeholder="Symptoms or reason for visit..." 
                                            value={opForm.reason} 
                                            onChange={e => setOpForm({...opForm, reason: e.target.value})} 
                                        />
                                    </div>

                                    <Button 
                                        onClick={handleOPSubmit} 
                                        disabled={submitting || !opForm.doctorId || !opForm.timeSlot}
                                        className="w-full bg-[#02B69A] hover:bg-[#00D4AA] text-black font-black h-14 rounded-xl shadow-xl transition-all active:scale-[0.98] text-sm uppercase tracking-widest mt-4"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Appointment"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Admitting Physician</label>
                                            <select 
                                                className={inputClass} 
                                                value={ipForm.doctorId} 
                                                onChange={e => setIpForm({...ipForm, doctorId: e.target.value})}
                                            >
                                                <option value="">Select Doctor</option>
                                                {doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.name} ({d.specialty})</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Admission Date</label>
                                            <input 
                                                type="date" 
                                                className={inputClass} 
                                                value={ipForm.admissionDate} 
                                                onChange={e => setIpForm({...ipForm, admissionDate: e.target.value})} 
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Ward Designation</label>
                                            <input 
                                                className={inputClass} 
                                                placeholder="General, ICU, Private..." 
                                                value={ipForm.ward} 
                                                onChange={e => setIpForm({...ipForm, ward: e.target.value})} 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Bed Assignment</label>
                                            <input 
                                                className={inputClass} 
                                                placeholder="Bed # (e.g. 104-B)" 
                                                value={ipForm.bedNumber} 
                                                onChange={e => setIpForm({...ipForm, bedNumber: e.target.value})} 
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 pt-4">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Clinical Indication for Admission</label>
                                        <textarea 
                                            className={inputClass} 
                                            rows={3} 
                                            placeholder="Primary diagnosis or reason for admission..." 
                                            value={ipForm.admissionReason} 
                                            onChange={e => setIpForm({...ipForm, admissionReason: e.target.value})} 
                                        />
                                    </div>

                                    <Button 
                                        onClick={handleIPSubmit} 
                                        disabled={submitting || !ipForm.doctorId || !ipForm.ward || !ipForm.bedNumber}
                                        className="w-full bg-white hover:bg-slate-100 text-black font-black h-14 rounded-xl shadow-xl transition-all active:scale-[0.98] text-sm uppercase tracking-widest mt-4"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Initiate IP Admission"}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
