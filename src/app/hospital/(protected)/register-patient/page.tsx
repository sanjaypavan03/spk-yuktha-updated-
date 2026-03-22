"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search, UserPlus, CheckCircle2, User, Calendar, Clock,
  BedDouble, Loader2, Copy, AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function HospitalRegisterPatientPage() {
  const { toast } = useToast();
  const [mode, setMode] = useState<'OP' | 'IP'>('OP');

  // Patient search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // New patient registration
  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', dob: '' });
  const [registering, setRegistering] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  // Doctors
  const [doctors, setDoctors] = useState<any[]>([]);

  // OP form
  const [opForm, setOpForm] = useState({ doctorId: '', date: '', timeSlot: '', reason: '' });
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // IP form
  const [ipForm, setIpForm] = useState({ doctorId: '', ward: '', bedNumber: '', admissionReason: '', admissionDate: new Date().toISOString().split('T')[0] });

  // Success
  const [success, setSuccess] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const inputClass = "w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#02B69A] focus:ring-1 focus:ring-[#02B69A] transition-colors";

  useEffect(() => {
    fetch('/api/hospital/staff').then(r => r.json()).then(d => setDoctors(d.doctors || [])).catch(() => {});
  }, []);

  // Debounced search
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

  const handleRegister = async () => {
    if (!regForm.name || !regForm.email || !regForm.phone) {
      toast({ variant: 'destructive', description: 'Name, email, and phone are required.' });
      return;
    }
    setRegistering(true);
    try {
      const res = await fetch('/api/hospital/patient-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedPatient(data.patient);
        setTempPassword(data.tempPassword || '');
        setShowRegister(false);
        toast({ title: 'Patient Registered' });
      } else {
        const data = await res.json();
        toast({ variant: 'destructive', description: data.error || 'Registration failed' });
      }
    } catch (e) { toast({ variant: 'destructive', description: 'Network error' }); }
    finally { setRegistering(false); }
  };

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
    if (!selectedPatient || !opForm.doctorId || !opForm.date || !opForm.timeSlot) {
      toast({ variant: 'destructive', description: 'Please complete all fields.' });
      return;
    }
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
        setSuccess({
          type: 'OP',
          patientName: selectedPatient.name,
          doctor: doctors.find(d => d._id === opForm.doctorId)?.name,
          date: opForm.date,
          timeSlot: opForm.timeSlot
        });
      } else {
        const data = await res.json();
        toast({ variant: 'destructive', description: data.error || 'Failed' });
      }
    } catch (e) { toast({ variant: 'destructive', description: 'Network error' }); }
    finally { setSubmitting(false); }
  };

  const handleIPSubmit = async () => {
    if (!selectedPatient || !ipForm.doctorId || !ipForm.ward || !ipForm.bedNumber || !ipForm.admissionReason) {
      toast({ variant: 'destructive', description: 'Please complete all fields.' });
      return;
    }
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
        setSuccess({
          type: 'IP',
          patientName: selectedPatient.name,
          ward: ipForm.ward,
          bed: ipForm.bedNumber
        });
      } else {
        const data = await res.json();
        toast({ variant: 'destructive', description: data.error || 'Admission failed' });
      }
    } catch (e) { toast({ variant: 'destructive', description: 'Network error' }); }
    finally { setSubmitting(false); }
  };

  const resetAll = () => {
    setSuccess(null);
    setSelectedPatient(null);
    setSearchQuery('');
    setSearchResults([]);
    setTempPassword('');
    setOpForm({ doctorId: '', date: '', timeSlot: '', reason: '' });
    setIpForm({ doctorId: '', ward: '', bedNumber: '', admissionReason: '', admissionDate: new Date().toISOString().split('T')[0] });
  };

  // Success State
  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-slate-900 border border-[#02B69A]/30 rounded-[32px] p-10 text-center max-w-md w-full space-y-4">
          <div className="w-16 h-16 bg-[#02B69A]/10 rounded-full flex items-center justify-center mx-auto border border-[#02B69A]/20">
            <CheckCircle2 className="w-8 h-8 text-[#02B69A]" />
          </div>
          <h2 className="text-2xl font-bold text-white font-playfair">
            {success.type === 'OP' ? 'Appointment Booked' : 'Patient Admitted'}
          </h2>
          <p className="text-slate-400">{success.patientName}</p>
          {success.type === 'OP' ? (
            <div className="bg-black/50 rounded-xl p-4 border border-slate-800 text-left space-y-2">
              <p className="text-sm text-slate-300"><span className="text-slate-500">Doctor:</span> {success.doctor}</p>
              <p className="text-sm text-slate-300"><span className="text-slate-500">Date:</span> {success.date}</p>
              <p className="text-sm text-slate-300"><span className="text-slate-500">Slot:</span> {success.timeSlot}</p>
            </div>
          ) : (
            <div className="bg-black/50 rounded-xl p-4 border border-slate-800 text-left space-y-2">
              <p className="text-sm text-slate-300"><span className="text-slate-500">Ward:</span> {success.ward}</p>
              <p className="text-sm text-slate-300"><span className="text-slate-500">Bed:</span> {success.bed}</p>
            </div>
          )}
          <button onClick={resetAll} className="w-full py-3 bg-[#02B69A] hover:bg-[#00D4AA] text-slate-950 font-bold rounded-xl transition-all">
            Register Another Patient
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white font-playfair tracking-tight mb-1">Register Patient</h2>
        <p className="text-slate-400 font-medium text-sm">Search existing patients or create new records.</p>
      </div>

      {/* OP / IP Toggle */}
      <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 max-w-xs">
        {(['OP', 'IP'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-widest rounded-lg transition-all ${
              mode === m ? 'bg-[#02B69A] text-black shadow-md' : 'text-slate-500 hover:text-white'
            }`}>
            {m === 'OP' ? 'Outpatient (OP)' : 'Inpatient (IP)'}
          </button>
        ))}
      </div>

      {/* Step 1 — Patient Lookup */}
      {!selectedPatient && (
        <Card className="bg-slate-900 border-slate-800 shadow-none">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Search className="w-4 h-4 text-[#02B69A]" /> Find Patient
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input className={`${inputClass} pl-10`} placeholder="Search by name, phone, or email..."
                value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setShowRegister(false); }} />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 animate-spin" />}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map(p => (
                  <div key={p._id} onClick={() => { setSelectedPatient(p); setSearchQuery(''); setSearchResults([]); }}
                    className="flex items-center gap-3 p-3 bg-black/40 border border-slate-800 rounded-xl cursor-pointer hover:border-[#02B69A]/30 transition-colors">
                    <User className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-bold text-white">{p.name}</p>
                      <p className="text-[11px] text-slate-500">{p.phone} · {p.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
              <div>
                <p className="text-sm text-slate-500 mb-2">No patient found.</p>
                <button onClick={() => setShowRegister(true)} className="text-[#02B69A] font-bold text-sm hover:underline flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" /> Register new patient
                </button>
              </div>
            )}

            {/* Inline Registration */}
            {showRegister && (
              <div className="bg-black/40 border border-slate-800 rounded-2xl p-5 space-y-4 mt-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2"><UserPlus className="w-4 h-4 text-[#02B69A]" /> New Patient</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input className={inputClass} placeholder="Full name" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} />
                  <input className={inputClass} placeholder="Email" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} />
                  <input className={inputClass} placeholder="Phone" value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})} />
                  <input type="date" className={inputClass} value={regForm.dob} onChange={e => setRegForm({...regForm, dob: e.target.value})} />
                </div>
                <button onClick={handleRegister} disabled={registering} className="bg-[#02B69A] hover:bg-[#00D4AA] text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 flex items-center gap-2">
                  {registering ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</> : 'Register & Continue'}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected Patient Badge */}
      {selectedPatient && (
        <div className="flex items-center justify-between bg-[#02B69A]/10 border border-[#02B69A]/20 rounded-xl px-5 py-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#02B69A]" />
            <div>
              <p className="text-sm font-bold text-white">{selectedPatient.name}</p>
              <p className="text-[11px] text-slate-400">{selectedPatient.email || selectedPatient.phone}</p>
            </div>
          </div>
          <button onClick={() => { setSelectedPatient(null); setTempPassword(''); }} className="text-xs text-slate-400 hover:text-white font-bold">Change</button>
        </div>
      )}

      {/* Temp Password */}
      {tempPassword && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-sm font-bold text-amber-300">Temporary Password</p>
              <p className="text-white font-mono text-lg">{tempPassword}</p>
            </div>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(tempPassword); toast({ title: 'Copied' }); }}
            className="text-amber-400 hover:text-amber-300"><Copy className="w-5 h-5" /></button>
        </div>
      )}

      {/* Step 2 — OP Form */}
      {selectedPatient && mode === 'OP' && (
        <Card className="bg-slate-900 border-slate-800 shadow-none">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#02B69A]" /> Book Appointment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select className={inputClass} value={opForm.doctorId} onChange={e => {
                setOpForm({...opForm, doctorId: e.target.value});
                if (opForm.date) fetchSlots(e.target.value, opForm.date);
              }}>
                <option value="">Select Doctor</option>
                {doctors.map(d => <option key={d._id} value={d._id}>{d.name} — {d.specialty}</option>)}
              </select>
              <input type="date" className={inputClass} value={opForm.date} onChange={e => {
                setOpForm({...opForm, date: e.target.value, timeSlot: ''});
                if (opForm.doctorId) fetchSlots(opForm.doctorId, e.target.value);
              }} />
            </div>

            {/* Time Slots */}
            {opForm.date && opForm.doctorId && (
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Available Slots</p>
                {slotsLoading ? (
                  <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                ) : slots.length === 0 ? (
                  <p className="text-sm text-slate-500">No slots available for this date.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map(slot => (
                      <button key={slot} onClick={() => setOpForm({...opForm, timeSlot: slot})}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                          opForm.timeSlot === slot
                            ? 'bg-[#02B69A] text-slate-950'
                            : 'bg-black border border-slate-700 text-slate-300 hover:border-[#02B69A]/30'
                        }`}>
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <input className={inputClass} placeholder="Reason for visit" value={opForm.reason} onChange={e => setOpForm({...opForm, reason: e.target.value})} />
            <button onClick={handleOPSubmit} disabled={submitting || !opForm.doctorId || !opForm.timeSlot}
              className="bg-[#02B69A] hover:bg-[#00D4AA] text-slate-950 font-bold px-8 py-3 rounded-xl text-sm disabled:opacity-50 flex items-center gap-2">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</> : <><CheckCircle2 className="w-4 h-4" /> Book Appointment</>}
            </button>
          </CardContent>
        </Card>
      )}

      {/* Step 2 — IP Form */}
      {selectedPatient && mode === 'IP' && (
        <Card className="bg-slate-900 border-slate-800 shadow-none">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-[#02B69A]" /> Admit Patient
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select className={inputClass} value={ipForm.doctorId} onChange={e => setIpForm({...ipForm, doctorId: e.target.value})}>
                <option value="">Admitting Doctor</option>
                {doctors.map(d => <option key={d._id} value={d._id}>{d.name} — {d.specialty}</option>)}
              </select>
              <input className={inputClass} placeholder="Ward (e.g. Ward A)" value={ipForm.ward} onChange={e => setIpForm({...ipForm, ward: e.target.value})} />
              <input className={inputClass} placeholder="Bed Number (e.g. Bed 4B)" value={ipForm.bedNumber} onChange={e => setIpForm({...ipForm, bedNumber: e.target.value})} />
              <input type="date" className={inputClass} value={ipForm.admissionDate} onChange={e => setIpForm({...ipForm, admissionDate: e.target.value})} />
            </div>
            <textarea className={inputClass} rows={3} placeholder="Admission reason..." value={ipForm.admissionReason} onChange={e => setIpForm({...ipForm, admissionReason: e.target.value})} />
            <button onClick={handleIPSubmit} disabled={submitting || !ipForm.doctorId || !ipForm.ward || !ipForm.bedNumber}
              className="bg-[#02B69A] hover:bg-[#00D4AA] text-slate-950 font-bold px-8 py-3 rounded-xl text-sm disabled:opacity-50 flex items-center gap-2">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Admitting...</> : <><CheckCircle2 className="w-4 h-4" /> Admit Patient</>}
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
