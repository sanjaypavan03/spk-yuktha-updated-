"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pill, Search, Plus, X, CheckCircle2, User, Printer, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DoctorPrescriptionsPage() {
  const { toast } = useToast();

  // Patients list for search
  const [patients, setPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Rx Form
  const [rxForm, setRxForm] = useState({
    name: '', dosage: '', frequency: 'Once daily', route: 'Oral', instructions: '', duration: '7 days'
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [doctorName, setDoctorName] = useState('');

  // History
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);

  const inputClass = "w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#02B69A] focus:ring-1 focus:ring-[#02B69A] transition-colors";

  useEffect(() => {
    // Get doctor info
    fetch('/api/doctor/me').then(r => r.json()).then(d => setDoctorName(d.user?.name || 'Doctor'));
    // Get all patients
    fetch('/api/doctor/patients').then(r => r.json()).then(d => setPatients(d.patients || [])).catch(() => {
      // Fallback: get from appointments
      fetch('/api/appointments?date=all').then(r => r.json()).then(d => {
        const map = new Map();
        d.appointments?.forEach((a: any) => { if (a.patientId) map.set(a.patientId._id, a.patientId); });
        setPatients(Array.from(map.values()));
      });
    });
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/doctor/prescriptions');
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data.prescriptions || []);
      }
    } catch (e) { console.error(e); }
    finally { setHistoryLoading(false); }
  };

  const filteredPatients = patients.filter(p =>
    p.name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.email?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedPatient || !rxForm.name) {
      toast({ variant: 'destructive', description: 'Select a patient and enter medicine name.' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/hospital/prescribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedPatient._id,
          name: rxForm.name,
          dosage: rxForm.dosage,
          time: rxForm.frequency, // Map frequency to 'time' expected by API
          instructions: rxForm.instructions,
          route: rxForm.route
        })
      });
      if (res.ok) {
        setConfirmation({
          doctorName,
          patientName: selectedPatient.name,
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          ...rxForm
        });
        toast({ title: 'Prescription Issued' });
        setRxForm({ name: '', dosage: '', frequency: 'Once daily', route: 'Oral', instructions: '', duration: '7 days' });
        setSelectedPatient(null);
        setPatientSearch('');
        fetchHistory();
      } else {
        const data = await res.json();
        toast({ variant: 'destructive', description: data.error || 'Failed to issue' });
      }
    } catch (e) { toast({ variant: 'destructive', description: 'Network error' }); }
    finally { setSubmitting(false); }
  };

  const handleCancel = async (rxId: string) => {
    try {
      const res = await fetch(`/api/prescriptions/${rxId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' })
      });
      if (res.ok) { toast({ title: 'Cancelled' }); fetchHistory(); }
    } catch (e) { console.error(e); }
  };

  const handleReissue = (rx: any) => {
    setRxForm({
      name: rx.medicineName || '',
      dosage: rx.dosage || '',
      frequency: rx.frequency || 'Once daily',
      route: rx.route || 'Oral',
      instructions: rx.instructions || '',
      duration: '7 days'
    });
    // Find and select the patient
    const p = patients.find(p => p._id === (rx.patientId?._id || rx.patientId));
    if (p) { setSelectedPatient(p); setPatientSearch(p.name); }
    setConfirmation(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const statusColor = (s: string) => {
    if (s === 'Active') return 'bg-[#02B69A]/10 text-[#02B69A] border-[#02B69A]/20';
    if (s === 'Cancelled') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    return 'bg-slate-800 text-slate-400 border-slate-700';
  };

  const filteredHistory = prescriptions.filter(rx =>
    rx.medicineName?.toLowerCase().includes(historySearch.toLowerCase()) ||
    rx.patientId?.name?.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white font-playfair tracking-tight mb-1">Prescriptions</h2>
        <p className="text-slate-400 font-medium text-sm">Issue new prescriptions and manage history.</p>
      </div>

      {/* SECTION 1 — Issue New */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <h3 className="text-sm font-black text-[#02B69A] uppercase tracking-widest flex items-center gap-2">
          <Pill className="w-4 h-4" /> Issue New Prescription
        </h3>

        {/* Patient Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            className={`${inputClass} pl-10`}
            placeholder="Search patient by name..."
            value={patientSearch}
            onChange={e => {
              setPatientSearch(e.target.value);
              setShowDropdown(true);
              if (!e.target.value) setSelectedPatient(null);
            }}
            onFocus={() => setShowDropdown(true)}
          />
          {selectedPatient && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#02B69A]/10 text-[#02B69A] text-[10px] font-black px-2 py-0.5 rounded border border-[#02B69A]/20">SELECTED</span>
          )}
          {showDropdown && patientSearch && !selectedPatient && filteredPatients.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl max-h-48 overflow-y-auto shadow-2xl">
              {filteredPatients.slice(0, 8).map(p => (
                <div key={p._id} onClick={() => { setSelectedPatient(p); setPatientSearch(p.name); setShowDropdown(false); }}
                  className="px-4 py-3 hover:bg-slate-800 cursor-pointer flex items-center gap-3 border-b border-slate-800/50 last:border-0">
                  <User className="w-4 h-4 text-slate-500" />
                  <div><p className="text-sm text-white font-bold">{p.name}</p><p className="text-[11px] text-slate-500">{p.email || p.phone}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input className={inputClass} placeholder="Medicine name" value={rxForm.name} onChange={e => setRxForm({...rxForm, name: e.target.value})} />
          <input className={inputClass} placeholder="Dosage (e.g. 500mg)" value={rxForm.dosage} onChange={e => setRxForm({...rxForm, dosage: e.target.value})} />
          <select className={inputClass} value={rxForm.frequency} onChange={e => setRxForm({...rxForm, frequency: e.target.value})}>
            <option>Once daily</option><option>Twice daily</option><option>Thrice daily</option><option>Four times daily</option><option>As needed</option>
          </select>
          <select className={inputClass} value={rxForm.route} onChange={e => setRxForm({...rxForm, route: e.target.value})}>
            <option>Oral</option><option>IV</option><option>Topical</option><option>Sublingual</option>
          </select>
          <select className={inputClass} value={rxForm.duration} onChange={e => setRxForm({...rxForm, duration: e.target.value})}>
            <option>3 days</option><option>5 days</option><option>7 days</option><option>14 days</option><option>30 days</option><option>Ongoing</option>
          </select>
          <textarea className={inputClass} rows={1} placeholder="Instructions (optional)" value={rxForm.instructions} onChange={e => setRxForm({...rxForm, instructions: e.target.value})} />
        </div>

        <button onClick={handleSubmit} disabled={submitting || !selectedPatient || !rxForm.name}
          className="bg-[#02B69A] hover:bg-[#00D4AA] text-slate-950 font-bold px-8 py-3 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center gap-2">
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Issuing...</> : <><CheckCircle2 className="w-4 h-4" /> Issue Prescription</>}
        </button>
      </div>

      {/* Confirmation Slip */}
      {confirmation && (
        <div className="bg-slate-900 border-l-4 border-[#02B69A] rounded-2xl p-6 space-y-3 print-rx">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-playfair italic font-black text-[#02B69A] tracking-tighter">yuktha<span className="inline-block w-[4px] h-[4px] bg-[#00D4AA] rounded-full ml-0.5 mb-[1px]"></span></h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Prescription</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white font-bold">Dr. {confirmation.doctorName}</p>
              <p className="text-[11px] text-slate-500">{confirmation.date}</p>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-3">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Patient</p>
            <p className="text-white font-bold">{confirmation.patientName}</p>
          </div>
          <div className="bg-black/50 rounded-xl p-4 border border-slate-800">
            <p className="text-white font-bold text-lg">{confirmation.name}</p>
            <p className="text-sm text-slate-400">{confirmation.dosage} • {confirmation.frequency} • {confirmation.route}</p>
            {confirmation.instructions && <p className="text-sm text-slate-500 mt-1 italic">"{confirmation.instructions}"</p>}
            <p className="text-[10px] text-slate-600 mt-2">Duration: {confirmation.duration}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="text-sm text-slate-400 hover:text-white font-bold flex items-center gap-1.5">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={() => setConfirmation(null)} className="text-sm text-slate-500 hover:text-white font-bold">Dismiss</button>
          </div>
        </div>
      )}

      {/* SECTION 2 — History */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white font-playfair tracking-tight">Prescription History</h3>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{prescriptions.length} Total</span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className={`${inputClass} pl-10`} placeholder="Search by medicine or patient name..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} />
        </div>

        {historyLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse bg-slate-900 rounded-2xl h-20 border border-slate-800" />)}</div>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-10 text-center">
            <Pill className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">No prescriptions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 text-[10px] text-slate-500 uppercase font-bold tracking-wider">Patient</th>
                  <th className="text-left py-3 text-[10px] text-slate-500 uppercase font-bold tracking-wider">Medicine</th>
                  <th className="text-left py-3 text-[10px] text-slate-500 uppercase font-bold tracking-wider hidden sm:table-cell">Dosage</th>
                  <th className="text-left py-3 text-[10px] text-slate-500 uppercase font-bold tracking-wider hidden md:table-cell">Frequency</th>
                  <th className="text-left py-3 text-[10px] text-slate-500 uppercase font-bold tracking-wider">Status</th>
                  <th className="text-left py-3 text-[10px] text-slate-500 uppercase font-bold tracking-wider hidden sm:table-cell">Date</th>
                  <th className="text-right py-3 text-[10px] text-slate-500 uppercase font-bold tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((rx: any) => (
                  <tr key={rx._id} className="border-b border-slate-800/50 hover:bg-slate-900/50">
                    <td className="py-3 text-white font-bold">{rx.patientId?.name || '--'}</td>
                    <td className="py-3 text-slate-300">{rx.medicineName}</td>
                    <td className="py-3 text-slate-400 hidden sm:table-cell">{rx.dosage}</td>
                    <td className="py-3 text-slate-400 hidden md:table-cell">{rx.frequency}</td>
                    <td className="py-3">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${statusColor(rx.status)}`}>{rx.status}</span>
                    </td>
                    <td className="py-3 text-slate-500 text-xs hidden sm:table-cell">{formatDate(rx.issuedAt || rx.createdAt)}</td>
                    <td className="py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        {rx.status === 'Active' && (
                          <button onClick={() => handleCancel(rx._id)} className="text-rose-400 hover:text-rose-300 text-xs font-bold">Cancel</button>
                        )}
                        <button onClick={() => handleReissue(rx)} className="text-[#02B69A] hover:text-[#00D4AA] text-xs font-bold">Reissue</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-rx, .print-rx * { visibility: visible; }
          .print-rx { position: absolute; left: 0; top: 0; width: 100%; background: white !important; color: black !important; padding: 40px !important; }
        }
      `}</style>
    </div>
  );
}
